// ZProxy Background Service Worker
// Based on proxy24-3.2 architecture

// 默认配置
const DEFAULT_CONFIG = {
  isProxyEnabled: false,
  currentProxy: 0,
  proxies: [
    {
      id: 'default',
      name: '',
      icon: '🌐',
      type: 'http',
      host: '127.0.0.1',
      port: 7890,
      username: null,
      password: null
    }
  ],
  whitelist: [
    '*.baidu.com',
    '*.microsoft.com',
    '*.microsoftonline.com',
    '*.bing.com',
    '*.baiduapis.com',
    '*.baidustatic.com',
    '*.360.com',
    '*.360.net',
    '*.sougou.com',
    '*.quark.cn',
    '*.effirst.com',
    '*.googleapis.com',
    '*.aliapp.org',
    '*.bdstatic.com',
    '*.sm.cn',
    '*.qq.com',
    '*.qq.net',
    '*.qq.cn',
    '*.weixin.com',
    '*.weixin.net',
    '*.weixin.qq.com',
    '*.weixin.qq.net',
    '*.weixin.qq.cn',
    '*.tongyi.com',
    '*.taobao.com',
    '*.tmall.com',
    '*.alipay.com',
    '*.163.com',
    '*.sina.com.cn',
    '*.weibo.com',
    '*.jd.com',
    '*.youku.com',
    '*.tudou.com',
    '*.bilibili.com',
    '*.iqiyi.com',
    '*.sohu.com',
    '*.cctv.com',
    '*.zhihu.com',
    '*.cnblogs.com',
    '*.csdn.net',
    '*.sogou.com',
    '*.360.cn',
    '*.huawei.com'
  ]
};

// 初始化配置
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.sync.get('config');
  if (!data.config) {
    await chrome.storage.sync.set({ config: DEFAULT_CONFIG });
  }
  // 初始化时设置为直连模式
  chrome.proxy.settings.set({
    value: { mode: 'direct' },
    scope: 'regular'
  }, function() {
    console.log('ZProxy: 初始化完成，设置为直连模式');
  });
});

// 监听配置变化
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.config) {
    setupProxy();
  }
});

// 格式化域名
function formatDomain(domain) {
  domain = domain.replace(/^(https?:\/\/)?(www\.)?/i, '');
  domain = domain.split('/')[0];
  return domain.trim().toLowerCase();
}

// 设置代理
async function setupProxy() {
  const data = await chrome.storage.sync.get('config');
  const config = data.config || DEFAULT_CONFIG;

  console.log('ZProxy setupProxy called:', config);

  // 清除之前的代理设置
  await chrome.proxy.settings.clear({ scope: 'regular' });

  if (!config.isProxyEnabled || !config.proxies || config.proxies.length === 0) {
    setBadge(false);
    return;
  }

  const proxy = config.proxies[config.currentProxy] || config.proxies[0];

  // 使用 proxy24-3.2 的方式：fixed_servers + bypassList
  updateProxySettings(config.isProxyEnabled, proxy, config.whitelist);
}

// 更新代理设置 (proxy24-3.2 风格)
function updateProxySettings(enable, proxyConfig, whitelist) {
  let config = {};

  if (enable && proxyConfig) {
    // 合并 http 和 https 类型，统一使用 http
    const scheme = (proxyConfig.type.toLowerCase() === 'https') ? 'http' : proxyConfig.type.toLowerCase();
    const whitelistDomains = whitelist || [];

    // 格式化白名单为 bypassList 格式
    const formattedWhitelist = [];
    whitelistDomains.forEach(domain => {
      // 添加带通配符的版本（匹配子域名）
      if (!domain.startsWith('*.')) {
        formattedWhitelist.push(`*.${domain}`);
      } else {
        formattedWhitelist.push(domain);
      }
      // 添加不带通配符的版本（匹配主域名）
      formattedWhitelist.push(domain.replace('*.', ''));
    });
    // 去重
    const uniqueWhitelist = [...new Set(formattedWhitelist)];

    const bypassList = ['<local>', 'localhost', '127.0.0.1', '::1', 'localhost.*'].concat(uniqueWhitelist);

    if (scheme === 'socks5' && proxyConfig.username && proxyConfig.password) {
      // 对于带认证的SOCKS5代理，使用PAC脚本
      let bypassRules = '';
      if (whitelistDomains.length > 0) {
        bypassRules = `
          if (${whitelistDomains.map(domain => `(host === "${domain}" || host.endsWith(".${domain}"))`).join(' || ')}) {
            return "DIRECT";
          }
        `;
      }

      const pacScript = `
        function FindProxyForURL(url, host) {
          host = host.toLowerCase();
          url = url.toLowerCase();

          if (shExpMatch(host, "localhost") ||
              shExpMatch(host, "127.*") ||
              shExpMatch(host, "::1") ||
              shExpMatch(host, "localhost.*")) {
            return "DIRECT";
          }
          ${bypassRules}
          return "SOCKS5 ${proxyConfig.host}:${proxyConfig.port}";
        }
      `;

      config = {
        mode: 'pac_script',
        pacScript: {
          data: pacScript
        }
      };
      console.log('ZProxy: 设置带认证的SOCKS5代理 (PAC脚本模式)，白名单域名数量:', whitelistDomains.length);
    } else {
      // 对于其他代理类型或不需要认证的SOCKS5，使用 fixed_servers + bypassList
      config = {
        mode: 'fixed_servers',
        rules: {
          singleProxy: {
            scheme: scheme,
            host: proxyConfig.host,
            port: parseInt(proxyConfig.port)
          },
          bypassList: bypassList
        }
      };
      console.log('ZProxy: 设置代理:', scheme, proxyConfig.host, proxyConfig.port, '白名单域名数量:', whitelistDomains.length);
      console.log('ZProxy: bypassList:', bypassList);
    }

    chrome.proxy.settings.set({
      value: config,
      scope: 'regular'
    }, function() {
      if (chrome.runtime.lastError) {
        console.error('ZProxy: 代理设置错误:', chrome.runtime.lastError);
      } else {
        console.log('ZProxy: 代理设置已更新, 完整配置:', JSON.stringify(config, null, 2));
        setBadge(true);

        // 验证设置是否成功
        chrome.proxy.settings.get({}, function(setting) {
          console.log('ZProxy: 当前生效的代理设置:', JSON.stringify(setting, null, 2));
        });
      }
    });
  } else {
    config = { mode: 'direct' };
    console.log('ZProxy: 设置为直连模式');

    chrome.proxy.settings.set({
      value: config,
      scope: 'regular'
    }, function() {
      if (chrome.runtime.lastError) {
        console.error('ZProxy: 代理设置错误:', chrome.runtime.lastError);
      } else {
        console.log('ZProxy: 代理设置已更新');
        setBadge(false);
      }
    });
  }
}

// 设置徽章状态
function setBadge(enabled) {
  const badgeText = enabled ? 'ON' : '';
  const badgeColor = enabled ? '#4caf50' : '#999999';

  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
}

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleProxy') {
    updateProxySettingsFromMessage(request.enable, request.proxyIndex, request.proxyConfig, request.whitelist);
    sendResponse({ success: true });
  } else if (request.action === 'getProxyState') {
    chrome.proxy.settings.get({}, function(config) {
      sendResponse({
        isEnabled: config.value.mode !== 'direct',
        currentConfig: config.value
      });
    });
    return true;
  } else if (request.action === 'addToWhitelist') {
    addToWhitelist(request.domain, sendResponse);
    return true;
  } else if (request.action === 'removeFromWhitelist') {
    removeFromWhitelist(request.domain, sendResponse);
    return true;
  } else if (request.action === 'batchAddToWhitelist') {
    batchAddToWhitelist(request.domains, sendResponse);
    return true;
  } else if (request.action === 'clearWhitelist') {
    clearWhitelist(sendResponse);
    return true;
  } else if (request.action === 'getWhitelist') {
    getWhitelist(sendResponse);
    return true;
  } else if (request.action === 'configUpdated') {
    setupProxy();
    sendResponse({ success: true });
  } else if (request.action === 'getConfig') {
    chrome.storage.sync.get('config', (result) => {
      sendResponse(result);
    });
    return true;
  }
  return true;
});

// 从消息更新代理设置
function updateProxySettingsFromMessage(enable, proxyIndex, proxyConfig, whitelist) {
  chrome.storage.sync.get(['config'], function(data) {
    const config = data.config || DEFAULT_CONFIG;
    config.isProxyEnabled = enable;
    if (proxyIndex !== undefined) {
      config.currentProxy = proxyIndex;
    }
    chrome.storage.sync.set({ config: config }, function() {
      // 立即应用代理设置，使用传递过来的配置（避免 storage 同步延迟）
      if (enable && proxyConfig) {
        updateProxySettings(true, proxyConfig, whitelist || []);
      } else {
        updateProxySettings(false, null, []);
      }
    });
  });
}

// 添加域名到白名单
function addToWhitelist(domain, callback) {
  if (!domain) {
    callback({ success: false, message: '域名不能为空' });
    return;
  }

  domain = formatDomain(domain);

  chrome.storage.sync.get(['config'], function(data) {
    const config = data.config || DEFAULT_CONFIG;
    const whitelist = config.whitelist || [];

    if (whitelist.includes(domain)) {
      callback({ success: false, message: '该域名已在白名单中' });
      return;
    }

    whitelist.push(domain);
    config.whitelist = whitelist;

    chrome.storage.sync.set({ config: config }, function() {
      callback({ success: true, whitelist: whitelist });
    });
  });
}

// 从白名单移除域名
function removeFromWhitelist(domain, callback) {
  if (!domain) {
    callback({ success: false, message: '域名不能为空' });
    return;
  }

  domain = formatDomain(domain);

  chrome.storage.sync.get(['config'], function(data) {
    const config = data.config || DEFAULT_CONFIG;
    const whitelist = config.whitelist || [];

    const index = whitelist.indexOf(domain);
    if (index === -1) {
      callback({ success: false, message: '该域名不在白名单中' });
      return;
    }

    whitelist.splice(index, 1);
    config.whitelist = whitelist;

    chrome.storage.sync.set({ config: config }, function() {
      callback({ success: true, whitelist: whitelist });
    });
  });
}

// 批量添加域名到白名单
function batchAddToWhitelist(domains, callback) {
  chrome.storage.sync.get(['config'], function(data) {
    const config = data.config || DEFAULT_CONFIG;
    const whitelist = config.whitelist || [];

    const validDomains = domains.map(d => formatDomain(d)).filter(d => d && !whitelist.includes(d));

    config.whitelist = [...whitelist, ...validDomains];

    chrome.storage.sync.set({ config: config }, function() {
      callback({ success: true, whitelist: config.whitelist });
    });
  });
}

// 清空白名单
function clearWhitelist(callback) {
  chrome.storage.sync.get(['config'], function(data) {
    const config = data.config || DEFAULT_CONFIG;
    config.whitelist = [];

    chrome.storage.sync.set({ config: config }, function() {
      callback({ success: true });
    });
  });
}

// 获取白名单
function getWhitelist(callback) {
  chrome.storage.sync.get(['config'], function(data) {
    const config = data.config || DEFAULT_CONFIG;
    callback({ whitelist: config.whitelist || [] });
  });
}

// 监听标签页更新
chrome.tabs.onActivated.addListener(() => {
  updateBadge();
});

chrome.tabs.onUpdated.addListener(() => {
  updateBadge();
});

async function updateBadge() {
  const data = await chrome.storage.sync.get('config');
  const config = data.config || DEFAULT_CONFIG;

  if (config.isProxyEnabled) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#4caf50' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// 处理代理认证
chrome.webRequest.onAuthRequired.addListener(
  function (details, callbackFn) {
    if (details.isProxy) {
      chrome.storage.sync.get('config', function(data) {
        const config = data.config || DEFAULT_CONFIG;
        if (config.isProxyEnabled && config.proxies && config.proxies[config.currentProxy]) {
          const proxy = config.proxies[config.currentProxy];
          if (proxy.username && proxy.password) {
            console.log('ZProxy: 提供代理认证信息');
            callbackFn({
              authCredentials: {
                username: proxy.username,
                password: proxy.password
              }
            });
            return;
          }
        }
        console.log('ZProxy: 没有代理认证信息');
        callbackFn({});
      });
    } else {
      callbackFn({});
    }
  },
  { urls: ["<all_urls>"] },
  ["asyncBlocking"]
);
