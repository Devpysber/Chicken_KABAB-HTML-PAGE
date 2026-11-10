/**
 * Menu data — edit names, descriptions and prices here.
 * Prices are in Indian Rupees.
 */

const CATEGORIES = [
  { id: 'chicken', label: 'Chicken Specialties' },
  { id: 'seafood', label: 'Fish & Prawns' },
  { id: 'veg', label: 'Vegetarian', veg: true },
];

const MENU = {
  chicken: [
    { id: 'chicken-tikka', name: 'Chicken Tikka', desc: 'Classic tandoor-roasted boneless chicken', half: 80, full: 140, group: 'Tikka & Kababs' },
    { id: 'chicken-pahadi-tikka', name: 'Chicken Pahadi Tikka', desc: 'Mint & coriander green marinade', half: 80, full: 140, group: 'Tikka & Kababs' },
    { id: 'chicken-afghani-tikka', name: 'Chicken Afghani Tikka', desc: 'Creamy, mildly spiced', half: 80, full: 140, group: 'Tikka & Kababs' },
    { id: 'chicken-seekh-kabab', name: 'Chicken Seekh Kabab', desc: 'Minced chicken grilled on skewers', half: 80, full: 140, group: 'Tikka & Kababs' },
    { id: 'chicken-leg', name: 'Chicken Leg', desc: 'Tandoori-marinated whole leg', half: 120, full: 240, group: 'Tikka & Kababs' },
    { id: 'chicken-reshmi-tikka', name: 'Chicken Reshmi Tikka', desc: 'Silky, soft and succulent', half: 80, full: 140, group: 'Tikka & Kababs' },
    { id: 'chicken-garlic-tikka', name: 'Chicken Garlic Tikka', desc: 'Roasted garlic marinade', half: 80, full: 140, group: 'Tikka & Kababs' },
    { id: 'chicken-tikka-peri-peri', name: 'Chicken Tikka Peri Peri', desc: 'Fiery peri peri spice', half: 80, full: 140, group: 'Tikka & Kababs' },
    { id: 'chicken-pahadi-tandoori', name: 'Chicken Pahadi Tandoori', desc: 'Green herb tandoori chicken', half: 170, full: 340, group: 'Tandoori Chicken' },
    { id: 'chicken-regular-tandoori', name: 'Chicken Regular Tandoori', desc: 'Traditional red tandoori chicken', half: 170, full: 340, group: 'Tandoori Chicken' },
    { id: 'chicken-afghani-tandoori', name: 'Chicken Afghani Tandoori', desc: 'Rich, creamy tandoori chicken', half: 170, full: 340, group: 'Tandoori Chicken' },
  ],
  seafood: [
    { id: 'fish-tikka', name: 'Fish Tikka', desc: 'Spiced fish chunks from the tandoor', half: 150, full: 240 },
    { id: 'prawns-tikka', name: 'Prawns Tikka', desc: 'Juicy marinated prawns, char-grilled', half: 150, full: 240 },
  ],
  veg: [
    { id: 'vege-paneer-tikka', name: 'Vege Paneer Tikka', desc: 'Cottage cheese, peppers & onion', half: 90, full: 180 },
    { id: 'vege-paneer-pahadi-tikka', name: 'Vege Paneer Pahadi Tikka', desc: 'Paneer in mint & coriander marinade', half: 90, full: 180 },
    { id: 'vege-afghani-paneer-tikka', name: 'Vege Afghani Paneer Tikka', desc: 'Creamy, mildly spiced paneer', half: 90, full: 180 },
  ],
};
