// ZProxy Popup - 多代理管理、主题切换、国际化

document.addEventListener('DOMContentLoaded', function() {
  const proxyList = document.getElementById('proxy-list');
  const addProxyButton = document.getElementById('add-proxy');

  // 输入框元素
  const proxyNameInput = document.getElementById('proxy-name');
  const proxyIconInput = document.getElementById('proxy-icon');
  const proxyTypeInput = document.getElementById('proxy-type');
  const proxyHostInput = document.getElementById('proxy-host');
  const proxyPortInput = document.getElementById('proxy-port');
  const proxyUsernameInput = document.getElementById('proxy-username');
  const proxyPasswordInput = document.getElementById('proxy-password');

  // 图标选择器逻辑
  const iconOptions = document.querySelectorAll('.icon-option');
  if (iconOptions.length > 0) {
    iconOptions.forEach(option => {
      option.addEventListener('click', function() {
        iconOptions.forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        if (proxyIconInput) {
          proxyIconInput.value = this.getAttribute('data-icon');
        }
      });
    });
  }

  // 白名单相关元素
  const whitelistItemsSelect = document.getElementById('whitelist-items');
  const removeWhitelistButton = document.getElementById('remove-whitelist');
  const batchWhitelistInput = document.getElementById('batch-whitelist');
  const clearWhitelistButton = document.getElementById('clear-whitelist');
  const batchAddWhitelistButton = document.getElementById('batch-add-whitelist');

  // 国际化资源
  const i18n = {
    zh: {
      tab_proxy: "代理设置",
      tab_add: "添加代理",
      tab_whitelist: "白名单",
      add_new_proxy: "添加新代理",
      label_name: "名称 (可选):",
      placeholder_name: "例如: 公司代理...",
      label_type: "类型:",
      label_host: "主机:",
      label_port: "端口:",
      label_username: "用户名:",
      label_password: "密码:",
      label_icon: "选择图标:",
      btn_add_proxy: "添加代理",
      whitelist_manager: "白名单管理",
      whitelist_help: "已预置国内常用网站白名单，支持通配符",
      placeholder_whitelist: "输入域名 (每行一个)",
      btn_add: "添加",
      msg_enter_host_port: "请输入代理主机和端口",
      msg_proxy_disabled: "已禁用代理",
      msg_proxy_enabled: "已启用代理",
      msg_proxy_enable_failed: "启用代理失败",
      msg_proxy_deleted: "代理已删除",
      msg_confirm_delete: "确定要删除这个代理吗？",
      msg_enter_domain: "请输入要添加的域名",
      msg_domains_added: "已添加 {n} 个域名",
      msg_select_domain: "请选择要移除的域名",
      msg_domain_removed: "域名已移除",
      msg_confirm_clear: "确定清空所有白名单吗？",
      msg_whitelist_cleared: "白名单已清空",
      proxy_disabled_name: "关闭代理",
      proxy_disabled_detail: "直接连接网络",
      btn_update_proxy: "更新代理",
      edit_proxy: "编辑代理",
      msg_proxy_updated: "代理已更新",
      toggle_theme: "切换主题",
      remove_selected: "移除选中",
      clear_all: "清空全部",
      btn_export: "📥 导出白名单",
      btn_import: "📤 导入白名单",
      msg_export_success: "白名单已导出",
      msg_import_success: "已导入 {n} 个域名",
      msg_import_error: "导入失败：无效的文件格式",
      msg_no_domains: "文件中没有有效的域名"
    },
    en: {
      tab_proxy: "Proxies",
      tab_add: "Add Proxy",
      tab_whitelist: "Whitelist",
      add_new_proxy: "Add New Proxy",
      label_name: "Name (Optional):",
      placeholder_name: "e.g. Company Proxy...",
      label_type: "Type:",
      label_host: "Host:",
      label_port: "Port:",
      label_username: "Username:",
      label_password: "Password:",
      label_icon: "Icon:",
      btn_add_proxy: "Add Proxy",
      whitelist_manager: "Whitelist Manager",
      whitelist_help: "Pre-configured with common Chinese websites, supports wildcards",
      placeholder_whitelist: "Enter domains (one per line)",
      btn_add: "Add",
      msg_enter_host_port: "Please enter host and port",
      msg_proxy_disabled: "Proxy Disabled",
      msg_proxy_enabled: "Proxy Enabled",
      msg_proxy_enable_failed: "Failed to enable proxy",
      msg_proxy_deleted: "Proxy Deleted",
      msg_confirm_delete: "Are you sure you want to delete this proxy?",
      msg_enter_domain: "Please enter domains to add",
      msg_domains_added: "Added {n} domains",
      msg_select_domain: "Please select a domain to remove",
      msg_domain_removed: "Domain removed",
      msg_confirm_clear: "Are you sure you want to clear the whitelist?",
      msg_whitelist_cleared: "Whitelist cleared",
      proxy_disabled_name: "Disable Proxy",
      proxy_disabled_detail: "Direct Connection",
      btn_update_proxy: "Update Proxy",
      edit_proxy: "Edit Proxy",
      msg_proxy_updated: "Proxy Updated",
      toggle_theme: "Toggle Theme",
      remove_selected: "Remove Selected",
      clear_all: "Clear All",
      btn_export: "📥 Export Whitelist",
      btn_import: "📤 Import Whitelist",
      msg_export_success: "Whitelist exported",
      msg_import_success: "Imported {n} domains",
      msg_import_error: "Import failed: invalid file format",
      msg_no_domains: "No valid domains found in file"
    }
  };

  // 状态变量
  let currentLang = 'zh';
  let currentTheme = 'dark';
  let editingProxyIndex = -1; // -1 表示添加模式，>=0 表示编辑模式

  // 初始化主题和语言
  chrome.storage.sync.get(['theme', 'lang'], function(data) {
    if (data.theme) {
      currentTheme = data.theme;
      applyTheme(currentTheme);
    }
    if (data.lang) {
      currentLang = data.lang;
      applyLanguage(currentLang);
    }
  });

  // 主题切换
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(currentTheme);
      chrome.storage.sync.set({ theme: currentTheme });
    });
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      if (themeToggle) themeToggle.textContent = '☀️';
    } else {
      document.body.classList.remove('light-theme');
      if (themeToggle) themeToggle.textContent = '🌗';
    }
  }

  // 语言切换
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', function() {
      currentLang = currentLang === 'zh' ? 'en' : 'zh';
      applyLanguage(currentLang);
      chrome.storage.sync.set({ lang: currentLang });
      loadProxies();
    });
  }

  function applyLanguage(lang) {
    const texts = i18n[lang];
    if (!texts) return;

    // 更新带有 data-i18n 的元素
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (texts[key]) el.textContent = texts[key];
    });

    // 更新带有 data-i18n-placeholder 的元素
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (texts[key]) el.placeholder = texts[key];
    });

    // 更新带有 data-i18n-title 的元素
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (texts[key]) el.title = texts[key];
    });

    // 更新按钮文本
    if (langToggle) langToggle.textContent = lang === 'zh' ? 'EN' : '中';
  }

  // 辅助函数：获取翻译文本
  function t(key, params = {}) {
    let text = i18n[currentLang][key] || key;
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v);
    }
    return text;
  }

  // 选项卡切换功能
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      this.classList.add('active');
      const tabId = this.getAttribute('data-tab');
      const content = document.getElementById(`${tabId}-tab`);
      if (content) content.classList.add('active');

      // 如果点击添加代理标签，重置表单
      if (tabId === 'add-proxy') {
        resetAddProxyForm();
      }
    });
  });

  // 初始化
  loadProxies();
  loadWhitelist();

  // ==================== 代理列表逻辑 ====================

  function loadProxies() {
    chrome.storage.sync.get(['config'], function(data) {
      const config = data.config || { proxies: [], isProxyEnabled: false, currentProxy: 0 };
      const proxies = config.proxies || [];
      const currentProxyIndex = config.currentProxy || 0;
      const isProxyEnabled = config.isProxyEnabled || false;

      renderProxyList(proxies, isProxyEnabled, currentProxyIndex);
    });
  }

  function renderProxyList(proxies, isEnabled, currentIndex) {
    if (!proxyList) return;
    proxyList.innerHTML = '';

    // 1. Disable 选项
    const disableItem = document.createElement('div');
    disableItem.className = 'proxy-item';
    if (!isEnabled) disableItem.classList.add('active');

    disableItem.innerHTML = `
      <div class="proxy-icon-display large">🚫</div>
      <div class="proxy-info">
        <div class="proxy-name error">${t('proxy_disabled_name')}</div>
        <div class="proxy-detail">${t('proxy_disabled_detail')}</div>
      </div>
    `;
    disableItem.addEventListener('click', () => disableProxy());
    proxyList.appendChild(disableItem);

    // 2. 代理列表
    proxies.forEach((proxy, index) => {
      const item = document.createElement('div');
      item.className = 'proxy-item';
      if (isEnabled && currentIndex === index) {
        item.classList.add('active');
      }

      const authBadge = (proxy.username && proxy.password) ? '🔒' : '';

      // 优先显示用户自定义的名称，如果没有则显示 Host:Port
      const displayName = proxy.name && proxy.name.trim() !== '' ? proxy.name : `${proxy.host}:${proxy.port}`;

      // 如果有自定义名称，则在详情里显示 Host:Port，否则显示类型
      const displayType = (proxy.type === 'http' || proxy.type === 'https') ? 'HTTP/HTTPS' : proxy.type.toUpperCase();
      const displayDetail = (proxy.name && proxy.name.trim() !== '')
        ? `${displayType} - ${proxy.host}:${proxy.port} ${authBadge}`
        : `${displayType} ${authBadge}`;

      // 使用存储的图标，默认地球
      const proxyIcon = proxy.icon || '🌐';

      // 是否已启用
      const isActive = isEnabled && currentIndex === index;
      const activeDot = isActive ? '<span class="active-dot"></span>' : '';

      item.innerHTML = `
        <div class="proxy-icon-display">${proxyIcon}</div>
        <div class="proxy-info">
          <div class="proxy-name">${displayName}${activeDot}</div>
          <div class="proxy-detail">${displayDetail}</div>
        </div>
        <div class="proxy-actions">
          <button class="proxy-action-btn edit-btn" title="${t('edit_proxy')}">✏️</button>
          <button class="proxy-action-btn delete-btn" title="删除">🗑️</button>
        </div>
      `;

      // 点击切换代理
      item.addEventListener('click', () => enableProxy(index, proxy));

      // 编辑按钮
      const editBtn = item.querySelector('.edit-btn');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editProxy(index);
      });

      // 删除按钮
      const deleteBtn = item.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(t('msg_confirm_delete'))) {
          deleteProxy(index);
        }
      });

      proxyList.appendChild(item);
    });
  }

  function disableProxy() {
    chrome.storage.sync.get(['config'], function(data) {
      const config = data.config || {};
      config.isProxyEnabled = false;
      chrome.storage.sync.set({ config: config }, function() {
        chrome.runtime.sendMessage({
          action: 'toggleProxy',
          enable: false
        }, function(response) {
          loadProxies();
          showMessage(t('msg_proxy_disabled'), 'error');
        });
      });
    });
  }

  function enableProxy(index, proxy, whitelistOverride) {
    chrome.storage.sync.get(['config'], function(data) {
      const config = data.config || {};
      config.isProxyEnabled = true;
      config.currentProxy = index;

      // 使用传入的 whitelist 或从 config 读取
      const whitelist = whitelistOverride !== undefined ? whitelistOverride : (config.whitelist || []);

      chrome.storage.sync.set({ config: config }, function() {
        chrome.runtime.sendMessage({
          action: 'toggleProxy',
          enable: true,
          proxyIndex: index,
          proxyConfig: proxy,
          whitelist: whitelist
        }, function(response) {
          if (response && response.success) {
            loadProxies();
            showMessage(t('msg_proxy_enabled'), 'success');
          } else {
            showMessage(t('msg_proxy_enable_failed'), 'error');
          }
        });
      });
    });
  }

  function deleteProxy(index) {
    chrome.storage.sync.get(['config'], function(data) {
      const config = data.config || { proxies: [], isProxyEnabled: false, currentProxy: 0 };
      const proxies = config.proxies || [];
      const wasEnabled = config.isProxyEnabled;
      const wasCurrent = config.currentProxy === index;

      // 删除
      proxies.splice(index, 1);

      const updates = { proxies: proxies };

      // 如果删除的是当前正在使用的代理
      if (wasEnabled && wasCurrent) {
        config.isProxyEnabled = false;
        // 禁用代理
        chrome.runtime.sendMessage({ action: 'toggleProxy', enable: false });
      }

      // 修正 currentProxy 索引
      if (config.currentProxy > index) {
        config.currentProxy = config.currentProxy - 1;
      } else if (config.currentProxy === index) {
        config.currentProxy = 0;
      }

      config.proxies = proxies;

      chrome.storage.sync.set({ config: config }, function() {
        loadProxies();
        showMessage(t('msg_proxy_deleted'), 'success');
      });
    });
  }

  function editProxy(index) {
    chrome.storage.sync.get(['config'], function(data) {
      const config = data.config || { proxies: [] };
      const proxies = config.proxies || [];
      const proxy = proxies[index];
      if (!proxy) return;

      // 设置为编辑模式
      editingProxyIndex = index;

      // 填充表单
      if (proxyNameInput) proxyNameInput.value = proxy.name || '';
      // 合并 http 和 https 类型，统一显示为 http
      if (proxyTypeInput) proxyTypeInput.value = (proxy.type === 'https') ? 'http' : (proxy.type || 'http');
      if (proxyHostInput) proxyHostInput.value = proxy.host || '';
      if (proxyPortInput) proxyPortInput.value = proxy.port || '';
      if (proxyUsernameInput) proxyUsernameInput.value = proxy.username || '';
      if (proxyPasswordInput) proxyPasswordInput.value = proxy.password || '';
      if (proxyIconInput) proxyIconInput.value = proxy.icon || '🌐';

      // 更新图标选择
      const iconOptions = document.querySelectorAll('.icon-option');
      iconOptions.forEach(opt => {
        if (opt.getAttribute('data-icon') === proxy.icon) {
          opt.classList.add('selected');
        } else {
          opt.classList.remove('selected');
        }
      });

      // 更新按钮文本
      if (addProxyButton) addProxyButton.textContent = t('btn_update_proxy');

      // 更新标题
      const title = document.querySelector('#add-proxy-tab h3');
      if (title) title.textContent = t('edit_proxy');

      // 切换到添加标签页
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      const addTab = document.querySelector('.tab[data-tab="add-proxy"]');
      if (addTab) addTab.classList.add('active');

      const content = document.getElementById('add-proxy-tab');
      if (content) content.classList.add('active');
    });
  }

  function resetAddProxyForm() {
    editingProxyIndex = -1;
    if (proxyNameInput) proxyNameInput.value = '';
    if (proxyHostInput) proxyHostInput.value = '';
    if (proxyPortInput) proxyPortInput.value = '';
    if (proxyUsernameInput) proxyUsernameInput.value = '';
    if (proxyPasswordInput) proxyPasswordInput.value = '';
    if (proxyTypeInput) proxyTypeInput.value = 'http';

    // 重置图标
    const firstIcon = document.querySelector('.icon-option');
    if (firstIcon) firstIcon.click();

    // 重置按钮文本
    if (addProxyButton) addProxyButton.textContent = t('btn_add_proxy');

    // 重置标题
    const title = document.querySelector('#add-proxy-tab h3');
    if (title) title.textContent = t('add_new_proxy');
  }

  // ==================== 添加代理逻辑 ====================
  if (addProxyButton) {
    addProxyButton.addEventListener('click', function() {
      const name = proxyNameInput ? proxyNameInput.value.trim() : '';
      const icon = proxyIconInput ? proxyIconInput.value : '🌐';
      const type = proxyTypeInput.value;
      const host = proxyHostInput.value.trim();
      const port = proxyPortInput.value.trim();
      const username = proxyUsernameInput.value.trim();
      const password = proxyPasswordInput.value.trim();

      if (!host || !port) {
        showMessage(t('msg_enter_host_port'), 'error');
        return;
      }

      chrome.storage.sync.get(['config'], function(data) {
        const config = data.config || { proxies: [] };
        const proxies = config.proxies || [];

        const newProxyConfig = {
          id: 'proxy_' + Date.now(),
          name: name,
          icon: icon,
          type: type,
          host: host,
          port: port,
          username: username,
          password: password
        };

        let isEdit = false;
        if (editingProxyIndex >= 0 && editingProxyIndex < proxies.length) {
          isEdit = true;
          newProxyConfig.id = proxies[editingProxyIndex].id;
          proxies[editingProxyIndex] = newProxyConfig;

          // 如果更新的是当前启用的代理，需要重新应用设置
          if (config.isProxyEnabled && config.currentProxy === editingProxyIndex) {
            chrome.runtime.sendMessage({
              action: 'toggleProxy',
              enable: true,
              proxyIndex: editingProxyIndex
            });
          }
        } else {
          proxies.push(newProxyConfig);
        }

        config.proxies = proxies;
        chrome.storage.sync.set({ config: config }, function() {
          // 等待 storage 同步完成后，重新读取完整的 config
          chrome.storage.sync.get(['config'], function(data) {
            const latestConfig = data.config || {};

            // 自动切换回列表页
            document.querySelector('.tab[data-tab="proxy"]').click();

            if (!isEdit) {
              // 新增代理，自动启用（传递最新的 proxy 和 whitelist）
              const newProxy = proxies[proxies.length - 1];
              enableProxy(proxies.length - 1, newProxy, latestConfig.whitelist || []);
              resetAddProxyForm();
            } else {
              loadProxies();
              resetAddProxyForm();
              showMessage(t('msg_proxy_updated'), 'success');
            }
          });
        });
      });
    });
  }

  // ==================== 白名单逻辑 ====================

  function loadWhitelist() {
    if (!whitelistItemsSelect) return;

    chrome.runtime.sendMessage({ action: 'getWhitelist' }, function(response) {
      if (response && response.whitelist) {
        whitelistItemsSelect.innerHTML = '';
        response.whitelist.forEach(domain => {
          const option = document.createElement('option');
          option.value = domain;
          option.textContent = domain;
          whitelistItemsSelect.appendChild(option);
        });
      }
    });
  }

  if (batchAddWhitelistButton) {
    batchAddWhitelistButton.addEventListener('click', function() {
      const text = batchWhitelistInput.value;
      if (!text.trim()) {
        showMessage(t('msg_enter_domain'), 'warning');
        return;
      }

      const domains = text.split('\n').map(d => d.trim()).filter(d => d);
      if (domains.length === 0) return;

      // 验证域名格式
      const validateDomain = (domain) => {
        if (domain === 'localhost') return true;

        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (ipRegex.test(domain)) {
          const parts = domain.split('.');
          return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
        }

        if (domain.startsWith('*.')) {
          const baseDomain = domain.slice(2);
          return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i.test(baseDomain);
        }

        return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i.test(domain);
      };

      const invalidDomains = domains.filter(d => !validateDomain(d));

      if (invalidDomains.length > 0) {
        showMessage(`无效的域名: ${invalidDomains[0]}`, 'error');
        return;
      }

      chrome.runtime.sendMessage({ action: 'batchAddToWhitelist', domains: domains }, function(res) {
        if (res && res.success) {
          batchWhitelistInput.value = '';
          loadWhitelist();
          showMessage(t('msg_domains_added', { n: domains.length }), 'success');
        }
      });
    });
  }

  if (removeWhitelistButton) {
    removeWhitelistButton.addEventListener('click', function() {
      if (!whitelistItemsSelect) return;
      const selectedIndex = whitelistItemsSelect.selectedIndex;
      if (selectedIndex === -1) {
        showMessage(t('msg_select_domain'), 'warning');
        return;
      }
      const domain = whitelistItemsSelect.options[selectedIndex].value;
      chrome.runtime.sendMessage({ action: 'removeFromWhitelist', domain: domain }, function(res) {
        if (res && res.success) {
          loadWhitelist();
          showMessage(t('msg_domain_removed'), 'success');
        }
      });
    });
  }

  if (clearWhitelistButton) {
    clearWhitelistButton.addEventListener('click', function() {
      if (confirm(t('msg_confirm_clear'))) {
        chrome.runtime.sendMessage({ action: 'clearWhitelist' }, function() {
          loadWhitelist();
          showMessage(t('msg_whitelist_cleared'), 'success');
        });
      }
    });
  }

  // ==================== 导入/导出白名单逻辑 ====================

  const exportWhitelistButton = document.getElementById('export-whitelist');
  const importWhitelistButton = document.getElementById('import-whitelist');
  const whitelistFileInput = document.getElementById('whitelist-file-input');

  // 导出白名单
  if (exportWhitelistButton) {
    exportWhitelistButton.addEventListener('click', function() {
      chrome.runtime.sendMessage({ action: 'getWhitelist' }, function(response) {
        if (response && response.whitelist) {
          const whitelist = response.whitelist;
          const content = whitelist.join('\n');
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
          const filename = `zproxy-whitelist-${timestamp}.txt`;

          chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
          }, function() {
            if (chrome.runtime.lastError) {
              console.error('Export error:', chrome.runtime.lastError);
            } else {
              showMessage(t('msg_export_success'), 'success');
            }
            URL.revokeObjectURL(url);
          });
        }
      });
    });
  }

  // 导入白名单 - 点击按钮触发文件选择
  if (importWhitelistButton && whitelistFileInput) {
    importWhitelistButton.addEventListener('click', function() {
      whitelistFileInput.click();
    });

    // 文件选择后读取并导入
    whitelistFileInput.addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        const content = e.target.result;
        const domains = content.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));

        if (domains.length === 0) {
          showMessage(t('msg_no_domains'), 'warning');
          return;
        }

        // 验证域名格式
        const validateDomain = (domain) => {
          if (domain === 'localhost') return true;

          const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
          if (ipRegex.test(domain)) {
            const parts = domain.split('.');
            return parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255);
          }

          if (domain.startsWith('*.')) {
            const baseDomain = domain.slice(2);
            return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i.test(baseDomain);
          }

          return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i.test(domain);
        };

        const invalidDomains = domains.filter(d => !validateDomain(d));

        if (invalidDomains.length > 0) {
          showMessage(t('msg_import_error') + ': ' + invalidDomains[0], 'error');
          return;
        }

        // 批量添加到白名单
        chrome.runtime.sendMessage({ action: 'batchAddToWhitelist', domains: domains }, function(res) {
          if (res && res.success) {
            loadWhitelist();
            showMessage(t('msg_import_success', { n: domains.length }), 'success');
          }
        });
      };

      reader.onerror = function() {
        showMessage(t('msg_import_error'), 'error');
      };

      reader.readAsText(file);

      // 清空 input 以便可以重复选择同一文件
      whitelistFileInput.value = '';
    });
  }

  // 辅助函数：显示消息
  function showMessage(text, type) {
    const container = document.getElementById('message-container');
    if (!container) return;

    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.textContent = text;

    container.appendChild(msg);

    setTimeout(() => {
      msg.style.opacity = '0';
      msg.style.transform = 'translateY(-20px)';
      setTimeout(() => container.removeChild(msg), 300);
    }, 2000);
  }
});
