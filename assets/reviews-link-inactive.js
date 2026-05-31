(function () {
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  const root = document.querySelector('[data-reviews-link-inactive]');
  if (!root) return;

  const used = root.querySelector('[data-reviews-status-used]');
  const expired = root.querySelector('[data-reviews-status-expired]');
  const cookieState = getCookie('reviews_link_state');
  const previewState = root.dataset.previewState;

  let state = cookieState || previewState || 'expired';
  if (state !== 'used' && state !== 'expired') state = 'expired';

  if (state === 'used') {
    if (used) used.hidden = false;
    if (expired) expired.hidden = true;
  } else {
    if (used) used.hidden = true;
    if (expired) expired.hidden = false;
  }

  if (cookieState) {
    document.cookie = 'reviews_link_state=; path=/; max-age=0; SameSite=Lax';
  }
})();
