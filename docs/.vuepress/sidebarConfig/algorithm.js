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

export default genSidebarAlgorithmConfig