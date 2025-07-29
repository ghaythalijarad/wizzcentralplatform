// Load shared sidebar markup and highlight active page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Sidebar script loaded');
  const container = document.getElementById('sidebar-placeholder');
  console.log('Container found:', container);
  if (!container) {
    console.error('sidebar-placeholder not found');
    return;
  }
  try {
    console.log('Fetching sidebar HTML...');
    const resp = await fetch('../includes/sidebar.html');
    console.log('Response:', resp.status);
    const html = await resp.text();
    console.log('HTML loaded, length:', html.length);
    container.innerHTML = html;
    const page = document.body.dataset.page;
    if (page) {
      const activeItem = container.querySelector(`.nav-item[data-page="${page}"]`);
      if (activeItem) activeItem.classList.add('active');
    }
    console.log('Sidebar loaded successfully');
  } catch (err) {
    console.error('Failed to load sidebar include:', err);
  }
});
