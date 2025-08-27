// Contains logic to show completeness
function getMissingFields(escort) {
  const missing = [];
  const defaultImage = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';

  if (!escort.name?.trim()) missing.push('Name');
  if (!escort.email?.trim()) missing.push('Email'); // fixed variable name
  if (!escort.city?.trim()) missing.push('City');
  if (!escort.about?.trim()) missing.push('About');
  if (!escort.areaLabel?.trim()) missing.push('areaLabel');
  if (!escort.userImg?.trim() || escort.userImg === defaultImage) missing.push('Image');
  if (!escort.dob) missing.push('Age');
  if (!escort.weight) missing.push('Weight');
  if (!escort.phone?.trim()) missing.push('Phone');

  return missing;
}

module.exports = { getMissingFields };
