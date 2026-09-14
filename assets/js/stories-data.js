/**
 * Keymakers Stories — verified content only.
 *
 * A story is publishable (featured video + play controls) only when
 * published === true AND name, image, and youtubeId are all present.
 * Leave unknown fields empty rather than inventing copy, titles, or media.
 *
 * Homepage portraits under assets/images/keymakers/ are not included here:
 * those files do not match the named people and must not be labeled as Keymakers.
 */
(function (global) {
  const THEMES = [
    {
      id: 'beginnings',
      label: 'New Beginnings',
      img: './assets/images/stories/theme-beginnings.webp',
      width: 810,
      height: 1013,
      alt: 'Sunrise over a golden field at the start of a new day',
    },
    {
      id: 'career',
      label: 'Career & Business',
      img: './assets/images/stories/theme-career.webp',
      width: 960,
      height: 1201,
      alt: 'Garments hanging on wooden hangers in a small shop',
    },
    {
      id: 'community',
      label: 'Community & Impact',
      img: './assets/images/stories/theme-community.webp',
      width: 960,
      height: 1200,
      alt: 'A New York City avenue with yellow taxis and neighborhood storefronts',
    },
    {
      id: 'challenges',
      label: 'Overcoming Challenges',
      img: './assets/images/stories/theme-challenges.webp',
      width: 857,
      height: 1072,
      alt: 'A winding road through a misty green mountain valley',
    },
    {
      id: 'leadership',
      label: 'Leadership & Mentorship',
      img: './assets/images/stories/theme-leadership.webp',
      width: 961,
      height: 1202,
      alt: 'A sunlit meeting table prepared for conversation',
    },
    {
      id: 'more',
      label: 'More Stories',
      img: './assets/images/stories/theme-more.webp',
      width: 1081,
      height: 1352,
      alt: 'A fountain pen writing on lined paper',
    },
  ];

  const STORIES = [
    {
      id: 'tamiko-maldonado',
      slug: 'tamiko-maldonado',
      published: true,
      name: 'Tamiko Maldonado',
      organization: 'CEO of Tamico Dancing',
      role: 'Key Carrier',
      title: '',
      summary: '',
      quote: 'My key was being in a community where there was no facility where they could have dancing and mentorship.',
      theme: 'community',
      img: './assets/images/stories/featured-tamiko.webp',
      imgWidth: 1280,
      imgHeight: 720,
      imgAlt: 'Dance class in session at Tamico Dancing',
      portrait: './assets/images/stories/tamiko-maldonado.webp',
      portraitWidth: 800,
      portraitHeight: 1422,
      portraitAlt: 'Tamiko Maldonado, CEO of Tamico Dancing and Key Carrier',
      youtubeId: 'Qe9IBmPSLSg',
      duration: '0:30',
      transcript: '',
      transcriptUrl: '',
    },
  ];

  function isPublishable(story) {
    return !!(
      story &&
      story.published &&
      story.name &&
      story.img &&
      story.youtubeId
    );
  }

  const KEYMAKERS = STORIES
    .filter((story) => story.name && story.portrait)
    .map((story) => ({
      id: story.id,
      name: story.name,
      organization: story.organization || '',
      role: story.role || '',
      img: story.portrait,
      width: story.portraitWidth || 800,
      height: story.portraitHeight || 1200,
      alt: story.portraitAlt || story.name,
      storyId: story.id,
      hasVideo: isPublishable(story),
      statusLabel: isPublishable(story) ? 'Watch her story' : 'Story coming soon',
    }));

  global.KEYMAKERS_STORIES = {
    THEMES,
    STORIES,
    KEYMAKERS,
    isPublishable,
    get featuredStory() {
      return STORIES.find(isPublishable) || null;
    },
  };
})(window);
