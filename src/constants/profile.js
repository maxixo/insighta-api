export const PROFILE_COLLECTION = 'profiles';

export const GENDERS = ['male', 'female'];

export const AGE_GROUPS = ['child', 'teenager', 'adult', 'senior'];

export const LIST_SORT_FIELDS = {
  age: 'age',
  created_at: 'created_at',
  gender_probability: 'gender_probability'
};

export const QUERY_DEFAULTS = {
  page: 1,
  limit: 10,
  maxLimit: 50,
  sortBy: 'created_at',
  order: 'desc'
};
