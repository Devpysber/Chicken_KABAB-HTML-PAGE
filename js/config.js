/**
 * Restaurant settings — edit this file to update contact details,
 * the WhatsApp ordering number, social links and site photography.
 */

const SITE = {
  name: 'The Best Chicken Kabab Corner',
  location: 'Best Colony, Goregaon West',
  timings: '5:00 PM – 12:00 AM',
  phones: ['+91 99878 34243', '+91 80970 05775'],

  /**
   * WhatsApp number that receives online orders.
   * Format: country code + number, digits only (no "+", spaces or dashes).
   * Currently set to the first listed restaurant phone. Change it if
   * orders should go to a different WhatsApp number.
   */
  whatsappNumber: '919987834243',

  /** Search text used for the Google Maps directions link and map embed. */
  mapsQuery: 'Best Colony, Goregaon West, Mumbai',

  /**
   * Social media profiles. Leave a value empty ('') to hide that icon.
   * Only real, configured URLs are shown on the site.
   */
  social: {
    instagram: '',
    facebook: '',
    youtube: '',
  },
};

/**
 * Photography. Swap any URL for a local file (e.g. 'images/hero.jpg')
 * to use the restaurant's own photos.
 */
const unsplash = (id, w) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const IMAGES = {
  hero: 'images/hero.webp',
  about: unsplash('photo-1555939594-58d7cb561ad1', 1000),
};
