import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArtstation,
  faBehance,
  faInstagram,
  faYoutube,
  faVimeoV,
  faTwitter,
  faPinterest,
  faSpotify,
  faReddit,
  faDeviantart,
  faWikipediaW,
  faBilibili,
  faSoundcloud,
  faAmazon,
  faGoogleDrive,
  faDropbox,
  faGithub,
  // faEpic is not available, we'll use a solid icon instead
  // ... 기타 필요한 아이콘들
} from '@fortawesome/free-brands-svg-icons';
import { faMusic, faGamepad, faShoppingCart, faShoppingBag, faVideo } from '@fortawesome/free-solid-svg-icons';

export const supportedPlatforms = [
  {
    name: 'ArtStation',
    domains: ['artstation.com'],
    status: 'coming',
    key: 'artstation',
    icon: faArtstation,
    category: 'Image'
  },
  {
    name: 'Behance',
    domains: ['behance.net', 'be.net'],
    status: 'coming',
    key: 'behance',
    icon: faBehance,
    category: 'Image'
  },
  {
    name: 'Instagram',
    domains: ['instagram.com', 'instagr.am'],
    status: 'coming',
    key: 'instagram',
    icon: faInstagram,
    category: 'Image'
  },
  {
    name: 'YouTube',
    domains: ['youtube.com', 'youtu.be'],
    status: 'active',
    key: 'youtube',
    icon: faYoutube,
    category: 'Video'
  },
  {
    name: 'Vimeo',
    domains: ['vimeo.com'],
    status: 'active',
    key: 'vimeo',
    icon: faVimeoV,
    category: 'Video'
  },
  {
    name: 'Twitter',
    domains: ['twitter.com'],
    status: 'coming',
    key: 'twitter',
    icon: faTwitter,
    category: 'Link'
  },
  {
    name: 'Pinterest',
    domains: ['pinterest.com', 'pinterest.co.uk', 'pinterest.ca', 'pin.it'],
    status: 'coming',
    key: 'pinterest',
    icon: faPinterest,
    category: 'Image'
  },
  {
    name: 'Spotify',
    domains: ['spotify.com'],
    status: 'active',
    key: 'spotify',
    icon: faSpotify,
    category: 'Music'
  },
  {
    name: 'Reddit',
    domains: ['reddit.com'],
    status: 'coming',
    key: 'reddit',
    icon: faReddit,
    category: 'Link'
  },
  {
    name: 'DeviantArt',
    domains: ['deviantart.com'],
    status: 'coming',
    key: 'deviantart',
    icon: faDeviantart,
    category: 'Image'
  },
  {
    name: 'Wikipedia',
    domains: [
      'wikipedia.org',
      'en.wikipedia.org',
      'ko.wikipedia.org',
      'ja.wikipedia.org',
      'zh.wikipedia.org',
      'fr.wikipedia.org',
      'de.wikipedia.org',
      'es.wikipedia.org',
      'm.wikipedia.org'
    ],
    status: 'coming',
    key: 'wikipedia',
    icon: faWikipediaW,
    category: 'Link'
  },
  {
    name: 'Bilibili',
    domains: ['bilibili.com', 'b23.tv'],
    status: 'coming',
    key: 'bilibili',
    icon: faBilibili,
    category: 'Video'
  },
  {
    name: 'Artlist',
    domains: ['artlist.io'],
    status: 'coming',
    key: 'artlist',
    icon: faMusic,
    category: 'Music'
  },
  {
    name: 'SoundCloud',
    domains: ['soundcloud.com'],
    status: 'coming',
    key: 'soundcloud',
    icon: faSoundcloud,
    category: 'Music'
  },
  {
    name: 'Youtube Music',
    domains: ['music.youtube.com'],
    status: 'coming',
    key: 'youtubeMusic',
    icon: faMusic,
    category: 'Music'
  },
  {
    name: 'Tidal',
    domains: ['tidal.com'],
    status: 'coming',
    key: 'tidal',
    icon: faSpotify,
    category: 'Music'
  },
  {
    name: 'GoogleDrive',
    domains: ['drive.google.com'],
    status: 'coming',
    key: 'googleDrive',
    icon: faGoogleDrive,
    category: 'Link'
  },
  {
    name: 'TikTok',
    domains: ['tiktok.com'],
    status: 'coming',
    key: 'tiktok',
    icon: faVideo,
    category: 'Video'
  },
  {
    name: 'Coupang',
    domains: ['coupang.com'],
    status: 'coming',
    key: 'coupang',
    icon: faShoppingCart,
    category: 'Link'
  },
  {
    name: 'Dropbox',
    domains: ['dropbox.com'],
    status: 'coming',
    key: 'dropbox',
    icon: faDropbox,
    category: 'Link'
  },
  {
    name: 'Amazon',
    domains: ['amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.de', 'amazon.fr', 'amazon.es', 'amazon.it', 'amazon.nl', 'amazon.pl', 'amazon.pt', 'amazon.ro', 'amazon.se', 'amazon.tr'],
    status: 'coming',
    key: 'amazon',
    icon: faAmazon,
    category: 'Link'
  },
  {
    name: 'AliExpress',
    domains: ['aliexpress.com'],
    status: 'coming',
    key: 'aliexpress',
    icon: faShoppingBag,
    category: 'Link'
  },
  {
    name: 'Github',
    domains: ['github.com'],
    status: 'coming',
    key: 'github',
    icon: faGithub,
    category: 'Code'
  }
];

const PlatformIcon = ({ url, className }) => {
  if (!url) return null;

  const getPlatform = (url) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      return supportedPlatforms.find(p => 
        p.domains?.some(domain => hostname.includes(domain))
      );
    } catch (e) {
      console.error('URL parsing error:', e);
      return null;
    }
  };

  const platform = getPlatform(url);
  
  if (!platform) return null;
  
  return (
    <FontAwesomeIcon 
      icon={platform.icon} 
      className={className}
      title={platform.name}
    />
  );
};

export default PlatformIcon; 