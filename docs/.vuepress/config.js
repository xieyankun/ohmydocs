module.exports = {
  base: '/ohmydocs/',
  locales: {
    '/': {
      lang: 'zh-CN',
      title: '知识库',
      description: '大道无形，不止于行'
    },
    '/en/': {
      lang: 'en-US',
      title: 'VuePress',
      description: 'Vue-powered Static Site Generator'
    }
  },
  head: [
    ['link', { rel: 'icon', href: '/logo.jpg' }]
  ],
  themeConfig: {
    editLinks: true,
    docsDir: 'docs',
    locales: {
      '/': {
        label: '简体中文',
        selectText: '选择语言',
        editLinkText: '在 GitHub 上编辑此页',
        lastUpdated: '上次更新',
        serviceWorker: {
          updatePopup: {
            message: "发现新内容可用",
            buttonText: "刷新"
          }
        },
        nav: [
          { text: '前端', link: '/guide/' },
          { text: '算法', link: '/algorithm/' },
          { text: '工具', link: '/tool/' }
        ],
        sidebar: {
          '/guide/': genSidebarGuideConfig('指南'),
          '/algorithm/': genSidebarAlgorithmConfig('指南'),
          '/tool/': genSidebarToolConfig('指南'),
        }
      }
    },
    '/en/': {
      label: 'English',
      selectText: 'Languages',
      editLinkText: 'Edit this page on GitHub',
      lastUpdated: 'Last Updated',
      serviceWorker: {
        updatePopup: {
          message: "New content is available.",
          buttonText: "Refresh"
        }
      },
      nav: [
        { text: 'Guide', link: '/en/guide/', }
      ]
    }
  }
}
// Guide 目录结构
function genSidebarGuideConfig (title) {
  return [
    {
      title,
      collapsable: false,
      children: [
        '',
        'getting-started'
      ]
    }
  ]
}
// Tool 目录结构
function genSidebarToolConfig (title) {
  return [
    {
      title,
      collapsable: false,
      children: [
        '',
      ]
    }
  ]
}

// algorithm 目录结构
function genSidebarAlgorithmConfig (title) {
  return [
    {
      title,
      collapsable: false,
      children: [
        '',
      ]
    }
  ]
}