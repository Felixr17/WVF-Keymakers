/**
 * Keymakers Stories — verified content only.
 *
 * Add approved YouTube IDs here (homepage clips vs. full Stories-page videos).
 * A story is playable when published === true AND name, image, and a video ID
 * for the requested context are present. Never invent copy, titles, or media.
 *
 * Homepage portraits under assets/images/keymakers/ are editorial placeholders
 * for the Featured Keymakers grid; they are not verified Stories-page portraits.
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
      width: 960,
      height: 1200,
      alt: 'A winding road through a misty green mountain valley',
    },
    {
      id: 'leadership',
      label: 'Leadership & Mentorship',
      img: './assets/images/stories/theme-leadership.webp',
      width: 960,
      height: 1200,
      alt: 'A sunlit meeting table prepared for conversation',
    },
    {
      id: 'more',
      label: 'More Stories',
      img: './assets/images/stories/theme-more.webp',
      width: 960,
      height: 1200,
      alt: 'A fountain pen writing on lined paper',
    },
  ];

  /**
   * Homepage Featured Keymakers playlist (fixed order).
   * homepageYoutubeId: approved shorter cut when available.
   * homepageStart / homepageEnd: optional clip bounds in seconds.
   */
  const HOMEPAGE_FEATURED_PLAYLIST = [
    {
      id: 'brenda',
      name: 'Brenda Braxton',
      title: 'CEO, Pause | Keymaker | Host Committee Co-Chair | Grammy Award Recipient',
      quote: 'My advice... there\u2019s always a way to get to a yes.',
      homepageYoutubeId: '',
      homepageStart: null,
      homepageEnd: null,
      img: './assets/images/keymakers/brenda-braxton.webp',
    },
    {
      id: 'angela',
      name: 'Angela Long',
      title: 'Legacy Jewelry Co. | Keymaker | Host Committee Co-Chair',
      quote: '',
      homepageYoutubeId: '',
      homepageStart: null,
      homepageEnd: null,
      img: './assets/images/keymakers/angela-long.webp',
    },
    {
      id: 'nikki',
      name: 'Nikki',
      title: 'Get Fit With Nik | Keymaker',
      quote: '',
      homepageYoutubeId: '',
      homepageStart: null,
      homepageEnd: null,
      img: './assets/images/keymakers/nikki.webp',
    },
    {
      id: 'loretta',
      name: 'Loretta',
      title: 'LA Sweets | Keymaker',
      quote: '',
      homepageYoutubeId: '',
      homepageStart: null,
      homepageEnd: null,
      img: './assets/images/keymakers/loretta.webp',
    },
    {
      id: 'michelle',
      name: 'Michelle',
      title: 'Michelle\u2019s Beauty Salon | Keymaker',
      quote: '',
      homepageYoutubeId: '',
      homepageStart: null,
      homepageEnd: null,
      img: './assets/images/keymakers/michelle.webp',
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
      /** Approved 30-second preview (not a 90-second full story). */
      youtubeId: 'Qe9IBmPSLSg',
      youtubeIdFull: '',
      videoKind: 'preview',
      duration: '0:30',
      durationFull: '',
      runtimeLabel: 'Short preview · 0:30',
      transcript: '',
      transcriptUrl: '',
    },
  ];

  function hasHomepageVideo(entry) {
    return !!(entry && entry.homepageYoutubeId);
  }

  function getHomepagePlayerConfig(entry) {
    if (!hasHomepageVideo(entry)) return null;
    return {
      youtubeId: entry.homepageYoutubeId,
      start: entry.homepageStart != null ? entry.homepageStart : null,
      end: entry.homepageEnd != null ? entry.homepageEnd : null,
    };
  }

  /** Stories-page modal: prefer full 90s asset when supplied. */
  function getStoriesPlayback(story) {
    if (!story) return null;
    if (story.youtubeIdFull) {
      return {
        youtubeId: story.youtubeIdFull,
        duration: story.durationFull || story.duration || '',
        runtimeLabel: story.durationFull ? `Full story · ${story.durationFull}` : 'Full story',
        videoKind: 'full',
      };
    }
    if (story.youtubeId && story.published) {
      return {
        youtubeId: story.youtubeId,
        duration: story.duration || '',
        runtimeLabel: story.runtimeLabel || story.duration || '',
        videoKind: story.videoKind || 'preview',
      };
    }
    return null;
  }

  function isPublishable(story) {
    return !!(story && story.published && story.name && story.img && getStoriesPlayback(story));
  }

  function isFullStory(story) {
    return !!(story && story.youtubeIdFull && story.published);
  }

  const featuredStoryEntry = STORIES.find(isPublishable) || null;

  const KEYMAKERS = STORIES
    .filter((story) => story.name && story.portrait)
    .filter((story) => !featuredStoryEntry || story.id !== featuredStoryEntry.id)
    .map((story) => {
      const playback = getStoriesPlayback(story);
      return {
        id: story.id,
        name: story.name,
        organization: story.organization || '',
        role: story.role || '',
        img: story.portrait,
        width: story.portraitWidth || 800,
        height: story.portraitHeight || 1200,
        alt: story.portraitAlt || story.name,
        storyId: story.id,
        quote: story.quote || '',
        hasVideo: !!playback,
        runtimeLabel: playback ? playback.runtimeLabel : '',
        statusLabel: playback ? 'Watch her story' : 'Story coming soon',
      };
    });

  global.KEYMAKERS_STORIES = {
    THEMES,
    STORIES,
    KEYMAKERS,
    HOMEPAGE_FEATURED_PLAYLIST,
    hasHomepageVideo,
    getHomepagePlayerConfig,
    getStoriesPlayback,
    isPublishable,
    isFullStory,
    get featuredStory() {
      return featuredStoryEntry;
    },
  };
})(window);
