import { getAbbreviatedState } from '../utils';

export interface NominatimAddressDetails {
  house_number?: string;
  road?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
  city_district?: string;
}

export interface AddressSuggestion {
  place_id: number;
  display_name: string;
  address: NominatimAddressDetails;
}

export const formatNominatimAddress = (
  addressDetails: NominatimAddressDetails | undefined,
  userInputForStreetNumber: string
): string => {
  if (!addressDetails) return '';

  let streetPart = '';
  let townSuburbPart = '';
  let statePart = '';
  let postcodePart = '';
  let countryPart = '';

  let streetNumber = addressDetails.house_number || '';
  if (!streetNumber && userInputForStreetNumber) {
    const inputMatch = userInputForStreetNumber.match(/^(\d+[a-zA-Z]?)/);
    if (inputMatch) streetNumber = inputMatch[1];
  }

  const roadName = addressDetails.road || '';
  if (streetNumber && roadName) streetPart = `${streetNumber} ${roadName}`;
  else if (roadName) streetPart = roadName;
  else if (streetNumber) streetPart = streetNumber;
  streetPart = streetPart.trim();

  townSuburbPart =
    addressDetails.suburb ||
    addressDetails.town ||
    addressDetails.village ||
    addressDetails.hamlet ||
    addressDetails.city ||
    addressDetails.county ||
    '';

  if (addressDetails.state && addressDetails.country_code) {
    statePart = getAbbreviatedState(addressDetails.state, addressDetails.country_code);
  } else if (addressDetails.state) {
    statePart = addressDetails.state;
  }

  postcodePart = addressDetails.postcode || '';
  countryPart = addressDetails.country || '';

  return [streetPart, townSuburbPart, statePart, postcodePart, countryPart]
    .filter(part => part && part.trim() !== '')
    .join(', ');
};
