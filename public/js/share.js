/**
 * PawPulse Native Web Share & Social Distribution Engine
 * Bridges navigator.share with desktop fallbacks and instant toast feedback.
 */

(function () {
  // Show sleek toast notification
  function showToast(message, type = 'success') {
    let toast = document.getElementById('pawpulse-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pawpulse-toast';
      toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-xs font-bold py-2.5 px-5 rounded-full shadow-2xl z-50 transition-all duration-300 transform opacity-0 translate-y-4 pointer-events-none flex items-center gap-2 border border-stone-800';
      document.body.appendChild(toast);
    }

    const icon = type === 'success' ? '📋' : '✨';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
      toast.classList.remove('opacity-100', 'translate-y-0');
    }, 2800);
  }

  // Universal share function
  window.pawPulseShare = async function (data = {}) {
    const title = data.title || document.title;
    const text = data.text || document.querySelector('meta[name="description"]')?.content || '';
    const url = data.url || window.location.href;

    // 1. Try Native Web Share API (Mobile & Modern Desktop)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        showToast('Article shared successfully!');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('[Share] navigator.share error:', err);
        } else {
          return; // User canceled share sheet
        }
      }
    }

    // 2. Fallback: Copy link to clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard!');
      } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('Link copied to clipboard!');
      }
    } catch (e) {
      prompt('Copy this link to share:', url);
    }
  };

  // Specific Social Share Handlers
  window.pawPulseSocialShare = function (platform, customUrl, customTitle) {
    const url = encodeURIComponent(customUrl || window.location.href);
    const title = encodeURIComponent(customTitle || document.title);

    let targetUrl = '';
    switch (platform) {
      case 'twitter':
      case 'x':
        targetUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'facebook':
        targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'whatsapp':
        targetUrl = `https://api.whatsapp.com/send?text=${title}%20${url}`;
        break;
      case 'linkedin':
        targetUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'reddit':
        targetUrl = `https://reddit.com/submit?url=${url}&title=${title}`;
        break;
      default:
        window.pawPulseShare({ url: customUrl, title: customTitle });
        return;
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer,width=600,height=450');
  };

  // Auto-wire share buttons
  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-share-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.getAttribute('data-share-action');
        if (action === 'native') {
          window.pawPulseShare();
        } else {
          window.pawPulseSocialShare(action);
        }
      });
    });
  });
})();
