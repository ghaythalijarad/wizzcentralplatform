// Load shared sidebar markup and highlight active page
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('sidebar-container');
  if (!container) return;
  try {
    const resp = await fetch('../includes/sidebar.html');
    const html = await resp.text();
    container.innerHTML = html;
    const page = document.body.dataset.page;
    if (page) {
      const activeItem = container.querySelector(`.nav-item[data-page="${page}"]`);
      if (activeItem) activeItem.classList.add('active');
    }
  } catch (err) {
    console.error('Failed to load sidebar include:', err);
  }
});
