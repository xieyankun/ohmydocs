module.exports = {
  base: '/ohmydocs/',
  title: 'Vue.js 源码分析',
  description: '大道无形，不止于行',
  head: [
    ['link', { rel: 'icon', href: '/logo.jpg' }]
  ],
  themeConfig: {
    lastUpdated: '上次更新',
    editLinkText: '在 GitHub 上编辑此页',
    nav: [
      { text: 'Home', link: '/' },
      { text: '团队', link: '/team/' },
      { text: 'GitHub', link: 'https://github.com/xieyankun/ohmydocs.git' },
    ],
    sidebar: [
      {
        title: '准备工作',
        collapsable: false,
        children: [
            ['prepare/', 'Introduction'],
            'prepare/structure',
            'prepare/flow',
        ]
      }
    ]
  }
}
