import { profileService } from '../services/profileService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateCreateProfileBody, validateProfileId } from '../validators/profileValidators.js';
import { validateListQuery, validateSearchQuery } from '../validators/queryValidators.js';

export const createProfile = asyncHandler(async (req, res) => {
  const normalizedName = validateCreateProfileBody(req.body);
  const result = await profileService.createProfile(normalizedName);

  if (!result.created) {
    res.status(200).json({
      status: 'success',
      data: result.profile,
      message: 'Profile already exists'
    });
    return;
  }

  res.status(201).json({
    status: 'success',
    data: result.profile
  });
});

export const listProfiles = asyncHandler(async (req, res) => {
  const queryOptions = validateListQuery(req.query);
  const result = await profileService.listProfiles(queryOptions);

  res.status(200).json({
    status: 'success',
    page: queryOptions.page,
    limit: queryOptions.limit,
    total: result.total,
    data: result.data
  });
});

export const searchProfiles = asyncHandler(async (req, res) => {
  const queryOptions = validateSearchQuery(req.query);
  const result = await profileService.searchProfiles(queryOptions);

  res.status(200).json({
    status: 'success',
    page: queryOptions.page,
    limit: queryOptions.limit,
    total: result.total,
    data: result.data
  });
});

export const getProfileById = asyncHandler(async (req, res) => {
  const profileId = validateProfileId(req.params.id);
  const profile = await profileService.getProfileById(profileId);

  res.status(200).json({
    status: 'success',
    data: profile
  });
});

export const deleteProfileById = asyncHandler(async (req, res) => {
  const profileId = validateProfileId(req.params.id);
  await profileService.deleteProfileById(profileId);
  res.status(204).send();
});
