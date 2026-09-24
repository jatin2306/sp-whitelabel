export const FLIGHT_TYPES = [
  { id: "international", name: "International" },
  { id: "domestic", name: "Domestic" },
];

export const CABIN_CLASSES = [
  { id: "economy", name: "Economy Class" },
  { id: "premium-economy", name: "Premium Economy Class" },
  { id: "business", name: "Business Class" },
  { id: "first", name: "First Class" },
];

export const AIRPORTS = [
  { id: "DEL", name: "Indira Gandhi International Airport", city: "Delhi" },
  {
    id: "BOM",
    name: "Chhatrapati Shivaji Maharaj International Airport",
    city: "Mumbai",
  },
  { id: "BLR", name: "Kempegowda International Airport", city: "Bengaluru" },
  { id: "MAA", name: "Chennai International Airport", city: "Chennai" },
  { id: "HYD", name: "Rajiv Gandhi International Airport", city: "Hyderabad" },
  {
    id: "CCU",
    name: "Netaji Subhas Chandra Bose International Airport",
    city: "Kolkata",
  },
  {
    id: "ATQ",
    name: "Sri Guru Ram Dass Jee International Airport",
    city: "Amritsar",
  },
  {
    id: "AMD",
    name: "Sardar Vallabhbhai Patel International Airport",
    city: "Ahmedabad",
  },
  { id: "GOI", name: "Manohar International Airport", city: "Goa" },
  { id: "COK", name: "Cochin International Airport", city: "Kochi" },
  { id: "PNQ", name: "Pune Airport", city: "Pune" },
  { id: "JAI", name: "Jaipur International Airport", city: "Jaipur" },
];

export const AIRLINES = [
  "IndiGo",
  "Air India",
  "Air India Express",
  "Vistara",
  "SpiceJet",
  "Akasa Air",
  "Emirates",
  "Qatar Airways",
  "Singapore Airlines",
  "British Airways",
  "Lufthansa",
];

export const COUNTRIES = [
  { id: "IN", name: "India", code: "+91", flag: "🇮🇳" },
  { id: "AE", name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { id: "SG", name: "Singapore", code: "+65", flag: "🇸🇬" },
  { id: "GB", name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { id: "US", name: "United States", code: "+1", flag: "🇺🇸" },
  { id: "QA", name: "Qatar", code: "+974", flag: "🇶🇦" },
];

export function countryById(id) {
  return COUNTRIES.find((item) => item.id === id) || COUNTRIES[0];
}

export function formatPickupAddress(data) {
  return [data.address1, data.address2, data.city, data.postalCode]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

export function airportLabel(id) {
  const airport = AIRPORTS.find((item) => item.id === id);
  return airport ? `${airport.city} (${airport.id})` : id;
}

export const VEHICLES = [
  {
    id: "economy",
    name: "Economy",
    tagline: "Comfortable sedan for city transfers",
    passengers: 3,
    luggage: 2,
    price: 48,
    hourly: 32,
    badge: "Most booked",
  },
  {
    id: "business",
    name: "Business",
    tagline: "Executive sedan with extra space",
    passengers: 3,
    luggage: 3,
    price: 78,
    hourly: 48,
    badge: "Recommended",
  },
  {
    id: "first",
    name: "First Class",
    tagline: "Premium chauffeur experience",
    passengers: 3,
    luggage: 3,
    price: 128,
    hourly: 75,
    badge: "",
  },
  {
    id: "suv",
    name: "SUV / Van",
    tagline: "Ideal for families and groups",
    passengers: 6,
    luggage: 6,
    price: 96,
    hourly: 58,
    badge: "",
  },
];

export const EXTRAS = [
  {
    id: "meet",
    name: "Meet & greet",
    detail: "Driver meets you in arrivals with a name sign",
    price: 18,
  },
  {
    id: "child",
    name: "Child seat",
    detail: "Forward-facing seat, complimentary fitting",
    price: 12,
  },
  {
    id: "stop",
    name: "Extra stop",
    detail: "One additional pickup or drop-off on route",
    price: 25,
  },
  {
    id: "wait",
    name: "Extra wait time",
    detail: "Add 30 minutes of complimentary waiting",
    price: 15,
  },
  {
    id: "water",
    name: "Bottled water",
    detail: "Chilled water for every passenger",
    price: 6,
  },
  {
    id: "wifi",
    name: "Onboard Wi-Fi",
    detail: "Stay connected throughout the journey",
    price: 8,
  },
];

export const BAG_SIZES = [
  // { id: 'cabin', name: 'Cabin' },
  { id: "small", name: "Small" },
  { id: "medium", name: "Medium" },
  { id: "large", name: "Large" },
  // { id: 'xl', name: 'Extra large' },
];

export const STEPS = [
  { id: 1, path: "/flight", label: "Flight" },
  { id: 2, path: "/documents", label: "Documents" },
  { id: 3, path: "/pickup", label: "Pickup" },
  { id: 4, path: "/timeslot", label: "Timeslot" },
  { id: 5, path: "/bags", label: "Bags" },
];

export const SUCCESS_PATH = "/success";
export const REVIEW_PATH = "/review";
export const PAYMENT_PATH = "/pay";
