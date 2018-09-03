module.exports = {
  base: '/ohmydocs/',
  locales: {
    '/': {
      lang: 'zh-CN',
      title: '知识库',
      description: '大道无形，不止于行'
    },
    // '/en/': {
    //   lang: 'en-US',
    //   title: 'VuePress',
    //   description: 'Vue-powered Static Site Generator'
    // }
  },
  head: [
    ['link', { rel: 'icon', href: '/logo.jpg' }]
  ],
  themeConfig: {
    repo: 'xieyankun/ohmydocs',
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
          { text: 'React', link: '/react/' },
          { text: '面试', link: '/interview/' },
          { text: '工具', link: '/tool/' }
        ],
        sidebar: {
          '/guide/': genSidebarGuideConfig('指南'),
          '/algorithm/': genSidebarAlgorithmConfig('指南'),
          '/react/': genSidebarReactConfig('指南'),
          '/interview/': genSidebarInterviewConfig('指南'),
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

// algorithm 目录结构
function genSidebarAlgorithmConfig (title) {
  return [
    {
      title,
      collapsable: false,
      children: [
        '',
        '排序',
        '斐波那契数列'
      ]
    }
  ]
}

// react 目录结构
function genSidebarReactConfig (title) {
  return [
    {
      title,
      collapsable: false,
      children: [
        '',
        'setState'
      ]
    }
  ]
}

// Interview 目录结构
function genSidebarInterviewConfig (title) {
  return [
    {
      title,
      collapsable: false,
      children: [
        '',
        'ES6',
        'CSS',
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