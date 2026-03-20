import { reactive, computed } from 'vue'

const messages = {
  en: {
    // Layout / Nav
    appTitle: 'Our Keepsake',
    appSubtitle: 'Since 2023',
    navOverview: 'Overview',
    navMoments: 'Moments',
    navAnniversaries: 'Anniversaries',
    navHome: 'Home',
    navRecords: 'Records',
    navDays: 'Days',
    newMemory: 'New Memory',

    // Home
    greeting: 'Good Evening.',
    greetingSub: 'Here are your latest memories and upcoming milestones.',
    featuredMoment: 'Featured Moment',
    daysTogether: 'Days Together',
    memoriesCaptured: 'Memories Captured',
    recentTimeline: 'Recent Timeline',
    viewAll: 'View all',
    daysAgo: '2 days ago',
    weekAgo: '1 week ago',
    coffeeDateTitle: 'Coffee Date Downtown',
    coffeeDateDesc: 'Found a new quiet spot downtown today. The vanilla latte was amazing.',
    movieNightTitle: 'Movie Night: Inception',
    movieNightDesc: 'Rewatched our favorite classic film with homemade popcorn.',

    // Records / Moments
    recordsTitle: 'Our Moments',
    recordsSubtitle: 'A private journal of shared experiences.',
    filterAll: 'All',
    filterDate: 'Date',
    filterTravel: 'Travel',
    filterFood: 'Food',
    filterMovie: 'Movie',
    searchPlaceholder: 'Search memories...',

    // Records mock data
    moment1Title: 'Coffee Date Downtown',
    moment1Desc: 'Found a new quiet spot downtown today. The vanilla latte was amazing, and we talked for hours about our future plans.',
    moment1Date: 'Mar 17, 2026',
    moment1Tag: 'Food',
    moment2Title: 'Movie Night: Inception',
    moment2Desc: 'Rewatched our favorite classic film with homemade popcorn. Still arguing about the ending.',
    moment2Date: 'Mar 12, 2026',
    moment2Tag: 'Movie',
    moment3Title: 'Sunset at the Beach',
    moment3Desc: 'Walked along the shore as the sun painted the sky in shades of orange and pink. A perfect moment of peace.',
    moment3Date: 'Mar 5, 2026',
    moment3Tag: 'Travel',
    moment4Title: 'Homemade Pasta Night',
    moment4Desc: 'Tried making carbonara from scratch. The kitchen was a mess but the result was surprisingly delicious.',
    moment4Date: 'Feb 28, 2026',
    moment4Tag: 'Food',
    moment5Title: 'Weekend in Kyoto',
    moment5Desc: 'Cherry blossoms everywhere. We visited Fushimi Inari and got lost in the thousand torii gates.',
    moment5Date: 'Feb 20, 2026',
    moment5Tag: 'Travel',
    moment6Title: 'Bookstore Adventure',
    moment6Desc: 'Spent the afternoon browsing through old bookshops. Each picked a book for the other to read.',
    moment6Date: 'Feb 14, 2026',
    moment6Tag: 'Date',

    // Anniversaries
    annivTitle: 'Anniversaries',
    annivSubtitle: 'Every precious moment, counted and cherished.',
    annivDaysTogether: 'Days Together',
    annivDaysTogetherDesc: 'Every second together is the most precious collection in life.',
    annivNextMilestone: 'Next Milestone',
    annivUpcoming: 'Upcoming',
    annivPast: 'Past Highlights',
    annivDaysLeft: 'days left',
    annivDaysAgoSuffix: 'days ago',

    anniv1Title: '3rd Anniversary',
    anniv1Date: 'Oct 24, 2026',
    anniv2Title: 'First Christmas Together',
    anniv2Date: 'Dec 25, 2026',
    anniv3Title: '1000 Days Together',
    anniv3Date: 'Jul 20, 2026',
    
    past1Title: 'First Date',
    past1Date: 'Oct 24, 2023',
    past1Desc: 'The story began on an ordinary afternoon.',
    past2Title: 'Seaside Summer Trip',
    past2Date: 'Jul 15, 2024',
    past2Desc: 'Listening to the waves, we made promises about our future.',
    past3Title: '1st Anniversary',
    past3Date: 'Oct 24, 2024',
    past3Desc: 'A whole year of laughter, growth, and love.',
    past4Title: 'First Christmas Together',
    past4Date: 'Dec 25, 2024',
    past4Desc: 'On this cold winter day, your smile was the warmest sunshine.',

    // New Memory
    newMemoryTitle: 'New Memory',
    newMemorySubtitle: 'Capture this moment forever.',
    newMemoryCoverPhoto: 'Cover Photo',
    newMemoryCoverHint: 'This will be shared to your private timeline.',
    newMemoryTapToAdd: 'Tap to add a photo',
    newMemoryTitleLabel: 'Title',
    newMemoryTitlePlaceholder: 'Give this memory a name...',
    newMemoryDateLabel: 'Date',
    newMemoryDatePlaceholder: 'When did it happen?',
    newMemoryTagLabel: 'Tag',
    newMemorySelectTag: 'Select a tag',
    newMemoryContentLabel: 'Your Story',
    newMemoryContentPlaceholder: 'Write about this moment...',
    newMemoryMoodLabel: 'Mood',
    newMemoryLocationLabel: 'Location',
    newMemoryLocationPlaceholder: 'Where were you?',
    newMemorySave: 'Save Memory',
    newMemoryCancel: 'Cancel',
    newMemoryMoodHappy: 'Happy',
    newMemoryMoodRomantic: 'Romantic',
    newMemoryMoodPeaceful: 'Peaceful',
    newMemoryMoodExcited: 'Excited',
    newMemoryMoodNostalgic: 'Nostalgic',

    // Language
    langSwitch: '中文',
  },
  zh: {
    // Layout / Nav
    appTitle: '我们的纪念册',
    appSubtitle: '始于 2023',
    navOverview: '概览',
    navMoments: '时光轴',
    navAnniversaries: '纪念日',
    navHome: '首页',
    navRecords: '记录',
    navDays: '纪念日',
    newMemory: '新增记忆',

    // Home
    greeting: '晚上好。',
    greetingSub: '这里是你最新的记忆和即将到来的里程碑。',
    featuredMoment: '精选时刻',
    daysTogether: '在一起天数',
    memoriesCaptured: '记录的回忆',
    recentTimeline: '最近的时光',
    viewAll: '查看全部',
    daysAgo: '2 天前',
    weekAgo: '1 周前',
    coffeeDateTitle: '市区咖啡约会',
    coffeeDateDesc: '今天在市区找到了一个安静的新去处，香草拿铁太好喝了。',
    movieNightTitle: '电影之夜：盗梦空间',
    movieNightDesc: '用自制爆米花重看了我们最爱的经典电影。',

    // Records / Moments
    recordsTitle: '我们的时光',
    recordsSubtitle: '属于我们的私密体验日记。',
    filterAll: '全部',
    filterDate: '约会',
    filterTravel: '旅行',
    filterFood: '美食',
    filterMovie: '电影',
    searchPlaceholder: '搜索记忆...',

    // Records mock data
    moment1Title: '市区咖啡约会',
    moment1Desc: '今天在市区找到了一个安静的新去处。香草拿铁太好喝了，我们聊了好几个小时关于未来的计划。',
    moment1Date: '2026年3月17日',
    moment1Tag: '美食',
    moment2Title: '电影之夜：盗梦空间',
    moment2Desc: '用自制爆米花重看了我们最爱的经典电影。结局的争论还是没有结果。',
    moment2Date: '2026年3月12日',
    moment2Tag: '电影',
    moment3Title: '海边日落',
    moment3Desc: '沿着海岸漫步，看着天空被染上橘红和粉色。一个完美而宁静的时刻。',
    moment3Date: '2026年3月5日',
    moment3Tag: '旅行',
    moment4Title: '自制意面之夜',
    moment4Desc: '尝试从零开始做卡博纳拉意面。厨房一团糟，但成果出奇地美味。',
    moment4Date: '2026年2月28日',
    moment4Tag: '美食',
    moment5Title: '京都周末',
    moment5Desc: '到处都是樱花。我们去了伏见稻荷大社，在千本�的鸟居中迷了路。',
    moment5Date: '2026年2月20日',
    moment5Tag: '旅行',
    moment6Title: '书店探险',
    moment6Desc: '整个下午都在逛旧书店。各自挑了一本书给对方阅读。',
    moment6Date: '2026年2月14日',
    moment6Tag: '约会',

    // Anniversaries
    annivTitle: '纪念日',
    annivSubtitle: '每一个珍贵的时刻，都值得铭记与珍藏。',
    annivDaysTogether: '在一起的日子',
    annivDaysTogetherDesc: '每一秒的陪伴，都是生命中最珍贵的收藏。',
    annivNextMilestone: '下一个里程碑',
    annivUpcoming: '即将到来',
    annivPast: '过往印记',
    annivDaysLeft: '天后',
    annivDaysAgoSuffix: '天前',

    anniv1Title: '三周年纪念日',
    anniv1Date: '2026年10月24日',
    anniv2Title: '一起过的第一个圣诞',
    anniv2Date: '2026年12月25日',
    anniv3Title: '在一起1000天',
    anniv3Date: '2026年7月20日',

    past1Title: '第一次约会',
    past1Date: '2023年10月24日',
    past1Desc: '故事的开始，其实只是一个普通的午后。',
    past2Title: '海边夏日旅行',
    past2Date: '2024年7月15日',
    past2Desc: '听着海浪的声音，许下我们关于未来的约定。',
    past3Title: '一周年纪念',
    past3Date: '2024年10月24日',
    past3Desc: '整整一年的欢笑、成长和爱。',
    past4Title: '第一个圣诞节',
    past4Date: '2024年12月25日',
    past4Desc: '在这个寒冷的冬日，你的笑容是我见过最温暖的阳光。',

    // New Memory
    newMemoryTitle: '记录此刻',
    newMemorySubtitle: '将这一刻永远珍藏。',
    newMemoryCoverPhoto: '封面照片',
    newMemoryCoverHint: '这将分享到我们的私密时间轴中。',
    newMemoryTapToAdd: '点击添加照片',
    newMemoryTitleLabel: '标题',
    newMemoryTitlePlaceholder: '给这段记忆起个名字…',
    newMemoryDateLabel: '日期',
    newMemoryDatePlaceholder: '发生在什么时候？',
    newMemoryTagLabel: '标签',
    newMemorySelectTag: '选择标签',
    newMemoryContentLabel: '你的故事',
    newMemoryContentPlaceholder: '写下这个时刻的点点滴滴…',
    newMemoryMoodLabel: '心情',
    newMemoryLocationLabel: '地点',
    newMemoryLocationPlaceholder: '你在哪里？',
    newMemorySave: '保存记忆',
    newMemoryCancel: '取消',
    newMemoryMoodHappy: '开心',
    newMemoryMoodRomantic: '浪漫',
    newMemoryMoodPeaceful: '宁静',
    newMemoryMoodExcited: '兴奋',
    newMemoryMoodNostalgic: '怀旧',

    // Language
    langSwitch: 'EN',
  }
}

const state = reactive({
  locale: 'en'
})

export function useI18n() {
  const t = (key) => {
    return messages[state.locale]?.[key] || messages.en[key] || key
  }

  const locale = computed(() => state.locale)

  const toggleLocale = () => {
    state.locale = state.locale === 'en' ? 'zh' : 'en'
  }

  const setLocale = (lang) => {
    state.locale = lang
  }

  return { t, locale, toggleLocale, setLocale }
}
