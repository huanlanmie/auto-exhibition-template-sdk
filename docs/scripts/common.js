/**
 * template-sdk 文档网站 - 公共脚本
 */

// 移动端菜单切换
function toggleMobileMenu() {
  const nav = document.getElementById('mobileNav');
  nav.classList.toggle('show');
}

// 复制代码
function copyCode(btn) {
  const codeBlock = btn.closest('.code-block, .step-code');
  const code = codeBlock.querySelector('code').textContent;

  navigator.clipboard.writeText(code).then(() => {
    const originalText = btn.textContent;
    btn.textContent = '已复制';
    btn.style.color = '#67c23a';
    btn.style.borderColor = '#67c23a';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  }).catch(err => {
    console.error('复制失败:', err);
  });
}

// 滚动监听
function handleScroll() {
  const header = document.querySelector('.site-header');
  if (window.scrollY > 100) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', handleScroll);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 高亮当前导航
  const currentPath = window.location.pathname;
  const navItems = document.querySelectorAll('.nav-item, .mobile-nav-item');

  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href && currentPath.includes(href.replace('./', ''))) {
      item.classList.add('active');
    }
  });

  // 代码块添加复制按钮
  document.querySelectorAll('pre code').forEach(block => {
    const pre = block.parentElement;
    if (!pre.closest('.code-window') && !pre.closest('.code-block')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = '复制';
      btn.onclick = () => copyCode(btn);
      wrapper.appendChild(btn);
    }
  });
});
