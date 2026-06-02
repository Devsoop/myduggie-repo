/**
 * Reviews submission forms — M3 App Proxy bridge.
 * Fetches session context from GET /apps/reviews/context, submits to POST /apps/reviews/submit.
 */
(function () {
  const PROXY_BASE = '/apps/reviews';
  const MAX_PHOTOS = 4;
  const MAX_WIDTH = 2400;
  const MAX_BYTES = Math.floor(1.5 * 1024 * 1024);

  function $(root, sel) {
    return root.querySelector(sel);
  }

  function $all(root, sel) {
    return Array.from(root.querySelectorAll(sel));
  }

  function readCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function clearCookie(name) {
    document.cookie = name + '=; Path=/; Max-Age=0';
  }

  /** @param {string|null} token @param {string|null} orderId */
async function fetchContext(token, orderId) {
  const url = PROXY_BASE + '/context'
    + '?token=' + encodeURIComponent(token ?? '')
    + '&order_id=' + encodeURIComponent(orderId ?? '');
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error('session_expired');
  return res.json();
}


  function renderOwns(form, owns) {
    const wrap = $(form, '[data-reviews-owns]');
    const list = $(form, '[data-reviews-owns-list]');
    if (!wrap || !list || !owns?.length) return;

    list.innerHTML = '';
    owns.forEach(function (item) {
      const li = document.createElement('li');
      li.className = 'reviews-form__owns-item';
      const color = item.variant_title && item.variant_title !== 'Default Title' ? item.variant_title : '';
      li.textContent = color ? item.product_title + ' · ' + color : item.product_title;
      list.appendChild(li);
    });
    wrap.hidden = false;
  }

  function initStars(form) {
    const group = $(form, '[data-reviews-stars]');
    const hidden = $(form, '[data-reviews-rating-input]');
    const submitBtn = $(form, '[data-reviews-submit]');
    if (!group || !hidden) return;

    let locked = 0;

    function paint(value, hover) {
      const display = hover || locked;
      $all(group, '[data-star-value]').forEach(function (btn) {
        const v = Number(btn.getAttribute('data-star-value'));
        const filled = v <= display;
        btn.classList.toggle('is-filled', filled);
        btn.classList.toggle('is-preview', hover > 0 && !locked);
        btn.setAttribute('aria-pressed', String(v === locked && locked > 0));
      });
    }

    $all(group, '[data-star-value]').forEach(function (btn) {
      const value = Number(btn.getAttribute('data-star-value'));

      btn.addEventListener('mouseenter', function () {
        if (!locked) paint(value, value);
        else paint(locked, value);
      });

      btn.addEventListener('mouseleave', function () {
        paint(locked, 0);
      });

      btn.addEventListener('click', function () {
        locked = value;
        hidden.value = String(value);
        paint(value, 0);
        if (submitBtn) submitBtn.disabled = false;
        hideFieldError(form, 'rating');
      });
    });
  }

  function hideFieldError(form, key) {
    const el = $(form, '[data-reviews-error="' + key + '"]');
    if (el) el.hidden = true;
  }

  function showFieldError(form, key, message) {
    const el = $(form, '[data-reviews-error="' + key + '"]');
    if (el) {
      if (message) el.textContent = message;
      el.hidden = false;
    }
  }

  
  function validateForm(form) {
    let valid = true;
    $all(form, '[data-reviews-error]').forEach(function (el) {
      el.hidden = true;
    });

    
    const rating = $(form, '[data-reviews-rating-input]');
    if (!rating?.value) {
      showFieldError(form, 'rating');
      valid = false;
    }

    $all(form, '[data-reviews-field][required]').forEach(function (field) {
      const name = field.getAttribute('data-reviews-field') || field.name;
      if (!field.value?.trim()) {
        showFieldError(form, name);
        valid = false;
      }
    });

    const proseRequired = $(form, '[data-reviews-prose][required]');
    if (proseRequired && !proseRequired.value.trim()) {
      showFieldError(form, 'prose_1');
      valid = false;
    }

    return valid;
  }

  function buildAnswers(form, reviewerType) {
    const answers = { prose: [] };

    if (reviewerType !== 'gifter') {
      const howOften = form.querySelector('[name="how_often"]');
      if (howOften?.value) answers.how_often = howOften.value;
    }

    if (reviewerType === 'buyer' || reviewerType === 'recipient') {
      const where = form.querySelector('[name="where_it_lives"]');
      const dugout = form.querySelector('[name="dugout_experience"]');
      if (where?.value) answers.where_it_lives = where.value;
      if (dugout?.value) answers.dugout_experience = dugout.value;
    }

    $all(form, '[data-reviews-prose]').forEach(function (area) {
      const body = area.value.trim();
      if (!body) return;
      answers.prose.push({
        prompt_key: area.getAttribute('data-prompt-key') || 'prose',
        label: area.getAttribute('data-label') || area.placeholder || '',
        display_label: area.getAttribute('data-label') || area.placeholder || '',
        body: body,
      });
    });

    return answers;
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  async function resizePhoto(file) {
    const img = await loadImage(file);
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > MAX_WIDTH) {
      h = Math.round((h * MAX_WIDTH) / w);
      w = MAX_WIDTH;
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    let quality = 0.92;
    let blob = await new Promise(function (resolve) {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });

    while (blob && blob.size > MAX_BYTES && quality > 0.4) {
      quality -= 0.08;
      blob = await new Promise(function (resolve) {
        canvas.toBlob(resolve, 'image/jpeg', quality);
      });
    }

    if (!blob) throw new Error('Could not process photo');
    const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], base + '.jpg', { type: 'image/jpeg' });
  }

  function initPhotos(form) {
    const zone = $(form, '[data-reviews-photo-zone]');
    const input = $(form, '[data-reviews-photo-input]');
    const preview = $(form, '[data-reviews-photo-preview]');
    if (!zone || !input || !preview) return;

    /** @type {File[]} */
    let files = [];

    function syncPreview() {
      preview.innerHTML = '';
      if (!files.length) {
        preview.hidden = true;
        return;
      }
      preview.hidden = false;
      files.forEach(function (file, index) {
        const li = document.createElement('li');
        li.className = 'reviews-form__photo-thumb';
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'reviews-form__photo-remove';
        remove.setAttribute('aria-label', 'Remove photo');
        remove.textContent = '×';
        remove.addEventListener('click', function () {
          files.splice(index, 1);
          syncPreview();
        });
        li.appendChild(img);
        li.appendChild(remove);
        preview.appendChild(li);
      });
    }

    function addFiles(incoming) {
      const next = incoming.filter(function (f) {
        return f.type.startsWith('image/');
      });
      const combined = files.concat(next);
      if (combined.length > MAX_PHOTOS) {
        showFieldError(form, 'photos', 'Maximum ' + MAX_PHOTOS + ' photos.');
        files = combined.slice(0, MAX_PHOTOS);
      } else {
        hideFieldError(form, 'photos');
        files = combined;
      }
      syncPreview();
      input.value = '';
    }

    zone.addEventListener('click', function () {
      input.click();
    });

    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.click();
      }
    });

    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('is-dragover');
    });

    zone.addEventListener('dragleave', function () {
      zone.classList.remove('is-dragover');
    });

    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('is-dragover');
      if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files));
    });

    input.addEventListener('change', function () {
      if (input.files) addFiles(Array.from(input.files));
    });

    form._reviewsPhotoFiles = function () {
      return files.slice();
    };
  }

  async function submitForm(form) {
    const submitBtn = $(form, '[data-reviews-submit]');
    const submitError = $(form, '[data-reviews-submit-error]');
    const reviewerType = form.getAttribute('data-reviewer-type') || 'buyer';

    if (!validateForm(form)) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting…';
    }
    if (submitError) submitError.hidden = true;

    try {
      const answers = buildAnswers(form, reviewerType);
      const body = new FormData();
      body.append('rating', $(form, '[data-reviews-rating-input]').value);
      body.append('answers', JSON.stringify(answers));
      const token = sessionStorage.getItem('review_token');
      const orderId = sessionStorage.getItem('review_order_id');
      if (token) body.append('token', token);
      if (orderId) body.append('order_id', orderId);

      const photoFiles = form._reviewsPhotoFiles ? form._reviewsPhotoFiles() : [];
      
      for (let i = 0; i < photoFiles.length; i++) {
        const resized = await resizePhoto(photoFiles[i]);
       body.append('photos', resized, resized.name);
      }

      const res = await fetch(PROXY_BASE + '/submit', {
        method: 'POST',
        credentials: 'same-origin',
        body: body,
      });

      const data = await res.json().catch(function () {
        return {};
      });

      if (res.status === 409 && data.redirect) {
        window.location.href = data.redirect;
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      sessionStorage.removeItem('review_token');
      sessionStorage.removeItem('review_order_id');

      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }

      window.location.href = '/pages/review-thank-you';
    } catch (err) {
      if (submitError) {
        submitError.textContent = err.message || 'Something went wrong. Try again.';
        submitError.hidden = false;
      }
      if (submitBtn) {
        submitBtn.disabled = !$(form, '[data-reviews-rating-input]')?.value;
        submitBtn.textContent = 'Submit review';
      }
    }
  }

  async function initForm(form) {
    initStars(form);
    initPhotos(form);

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || sessionStorage.getItem('review_token');
    const orderId = params.get('order') || sessionStorage.getItem('review_order_id');

    if (token) sessionStorage.setItem('review_token', token);
    if (orderId) sessionStorage.setItem('review_order_id', orderId);

    if (params.has('token')) {
      try {
        history.replaceState(null, '', window.location.pathname);
      } catch (_) {
        // blocked in sandboxed iframe contexts (e.g. Shopify web pixel sandbox)
      }
    }

    const sessionError = $(form, '[data-reviews-session-error]');
    let context = null;
    try {
      context = await fetchContext(token, orderId);
    } catch (_) {
      // session_expired or network error
    }

    if (!context) {
      if (sessionError) sessionError.hidden = false;
      form.querySelectorAll('input, select, textarea, button').forEach(function (el) {
        el.disabled = true;
      });
      return;
    }

    if (context.reviewer_name) {
      form.dataset.reviewerName = context.reviewer_name;
    }

    renderOwns(form, context.owns);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitForm(form);
    });
  }

  function initLinkInactive() {
    const wrap = document.querySelector('[data-reviews-link-state]');
    if (!wrap) return;

    const designMode = wrap.getAttribute('data-design-mode') === 'true';
    let state = wrap.getAttribute('data-link-state') || 'expired';

    if (!designMode) {
      const urlState = new URLSearchParams(window.location.search).get('state');
      if (urlState === 'used' || urlState === 'expired') {
        state = urlState;
      }

      const cookieState = readCookie('reviews_link_state');
      if (cookieState === 'used' || cookieState === 'expired') {
        state = cookieState;
        clearCookie('reviews_link_state');
      }
    }

    wrap.setAttribute('data-link-state', state);
    wrap.querySelectorAll('[data-state]').forEach(function (card) {
      card.hidden = card.getAttribute('data-state') !== state;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $all(document, '[data-reviews-form]').forEach(initForm);
    initLinkInactive();
  });
})();
