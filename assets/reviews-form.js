/**
 * Reviews submission forms — M3 App Proxy client
 * Fetches context from /apps/reviews/context, submits to /apps/reviews/submit
 */
(function () {
  const PROXY_BASE = '/apps/reviews';
  const MAX_PHOTOS = 4;
  const MAX_PHOTO_WIDTH = 2400;
  const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setStars(container, value, hoverValue) {
    const active = hoverValue ?? value;
    container.querySelectorAll('[data-star-value]').forEach((btn) => {
      const v = Number(btn.getAttribute('data-star-value'));
      const filled = v <= active;
      btn.classList.toggle('is-active', filled);
      btn.setAttribute('aria-checked', filled ? 'true' : 'false');
    });
  }

  async function resizeImage(file) {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width > MAX_PHOTO_WIDTH) {
      height = Math.round((height * MAX_PHOTO_WIDTH) / width);
      width = MAX_PHOTO_WIDTH;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let quality = 0.92;
    let blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    while (blob && blob.size > MAX_PHOTO_BYTES && quality > 0.4) {
      quality -= 0.08;
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    }
    if (!blob) throw new Error('Could not process image');
    if (blob.size > MAX_PHOTO_BYTES) throw new Error('Image exceeds 1.5MB after resize');
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  }

  function buildAnswers(form) {
    const formType = form.dataset.formType;
    const answers = { prose: [] };

    form.querySelectorAll('[name="how_often"], [name="where_it_lives"], [name="dugout_experience"]').forEach((el) => {
      if (el.value) answers[el.name] = el.value;
    });

    form.querySelectorAll('textarea[data-prose-key]').forEach((ta) => {
      const body = ta.value.trim();
      if (!body) return;
      answers.prose.push({
        prompt_key: ta.dataset.proseKey,
        label: ta.dataset.proseLabel || ta.placeholder,
        display_label: ta.dataset.proseLabel || ta.placeholder,
        body,
      });
    });

    if (formType === 'accessory' && answers.prose.length === 1) {
      answers.prose[0].prompt_key = 'combined';
    }

    return answers;
  }

  function showError(form, field, message) {
    const el = form.querySelector('[data-error-for="' + field + '"]');
    if (el) {
      el.textContent = message;
      el.hidden = !message;
    }
  }

  function validate(form) {
    let ok = true;
    form.querySelectorAll('[data-reviews-required]').forEach((el) => {
      const name = el.name || el.dataset.proseKey || 'field';
      if (!el.value.trim()) {
        showError(form, name === 'prose_1' ? 'prose_1' : el.name, 'Required');
        ok = false;
      } else {
        showError(form, name === 'prose_1' ? 'prose_1' : el.name, '');
      }
    });

    const rating = form.querySelector('[data-reviews-rating-input]');
    if (!rating.value) {
      showError(form, 'rating', 'Select a star rating');
      ok = false;
    } else {
      showError(form, 'rating', '');
    }

    return ok;
  }

  async function fetchContext() {
    const res = await fetch(PROXY_BASE + '/context', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('session_expired');
    return res.json();
  }

  async function initForm(form) {
    const stars = form.querySelector('[data-reviews-stars]');
    const ratingInput = form.querySelector('[data-reviews-rating-input]');
    const submitBtn = form.querySelector('[data-reviews-submit]');
    const photoInput = form.querySelector('[data-reviews-photo-input]');
    const photoTrigger = form.querySelector('[data-reviews-photo-trigger]');
    const photoPreviews = form.querySelector('[data-reviews-photo-previews]');
    const ownsList = form.querySelector('[data-reviews-owns-list]');
    const contextBlock = form.querySelector('[data-reviews-context]');
    let photos = [];

    try {
      const ctx = await fetchContext();
      if (ctx.owns?.length && ownsList && contextBlock) {
        contextBlock.hidden = false;
        ownsList.innerHTML = ctx.owns
          .map((o) => '<li>' + escapeHtml(o.product_title) + ' · ' + escapeHtml(o.variant_title) + '</li>')
          .join('');
      }
    } catch {
      const globalErr = form.querySelector('[data-reviews-global-error]');
      if (globalErr) {
        globalErr.textContent = 'Your review link has expired or is invalid. Please request a new link.';
        globalErr.hidden = false;
      }
      form.querySelectorAll('input, select, textarea, button').forEach((el) => {
        if (!el.hasAttribute('data-reviews-photo-trigger')) el.disabled = true;
      });
      return;
    }

    stars.querySelectorAll('[data-star-value]').forEach((btn) => {
      btn.addEventListener('mouseenter', () => setStars(stars, Number(ratingInput.value || 0), Number(btn.dataset.starValue)));
      btn.addEventListener('mouseleave', () => setStars(stars, Number(ratingInput.value || 0)));
      btn.addEventListener('click', () => {
        ratingInput.value = btn.dataset.starValue;
        setStars(stars, Number(ratingInput.value));
        submitBtn.disabled = false;
        showError(form, 'rating', '');
      });
    });

    photoTrigger?.addEventListener('click', () => photoInput.click());

    photoInput?.addEventListener('change', async () => {
      const files = Array.from(photoInput.files || []);
      photoInput.value = '';
      for (const file of files) {
        if (photos.length >= MAX_PHOTOS) {
          showError(form, 'photos', 'Maximum 4 photos');
          break;
        }
        try {
          photos.push(await resizeImage(file));
          renderPhotoPreviews();
          showError(form, 'photos', '');
        } catch (err) {
          showError(form, 'photos', err.message || 'Could not add photo');
        }
      }
    });

    function renderPhotoPreviews() {
      photoPreviews.innerHTML = '';
      photos.forEach((file, i) => {
        const wrap = document.createElement('div');
        wrap.className = 'reviews-form__photo-preview';
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          photos.splice(i, 1);
          renderPhotoPreviews();
        });
        wrap.appendChild(img);
        wrap.appendChild(remove);
        photoPreviews.appendChild(wrap);
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate(form)) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';

      const fd = new FormData();
      fd.append('rating', ratingInput.value);
      fd.append('answers', JSON.stringify(buildAnswers(form)));
      photos.forEach((file, i) => fd.append('photo_' + i, file));

      try {
        const res = await fetch(PROXY_BASE + '/submit', { method: 'POST', body: fd, credentials: 'same-origin' });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.redirect) {
          window.location.href = data.redirect;
          return;
        }
        if (res.status === 409 && data.redirect) {
          document.cookie = 'reviews_link_state=used; path=/; max-age=300; SameSite=Lax';
          window.location.href = data.redirect;
          return;
        }
        throw new Error(data.error || 'Submit failed');
      } catch (err) {
        const globalErr = form.querySelector('[data-reviews-global-error]');
        if (globalErr) {
          globalErr.textContent = err.message || 'Something went wrong. Please try again.';
          globalErr.hidden = false;
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit review';
      }
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  document.querySelectorAll('[data-reviews-form]').forEach((form) => initForm(form));
})();
