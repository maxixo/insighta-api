import { profileService } from '../services/profileService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createProfilesCsvFilename, serializeProfilesCsv } from '../utils/csv.js';
import { buildPaginatedResponse } from '../utils/pagination.js';
import { validateCreateProfileBody, validateProfileId } from '../validators/profileValidators.js';
import { validateExportQuery, validateListQuery, validateSearchQuery } from '../validators/queryValidators.js';

function buildProfileListResponse(req, queryOptions, result) {
  return buildPaginatedResponse({
    path: req.path === '/' ? req.baseUrl : `${req.baseUrl}${req.path}`,
    query: req.query,
    page: queryOptions.page,
    limit: queryOptions.limit,
    total: result.total,
    data: result.data
  });
}

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

  res.status(200).json(buildProfileListResponse(req, queryOptions, result));
});

export const searchProfiles = asyncHandler(async (req, res) => {
  const queryOptions = validateSearchQuery(req.query);
  const result = await profileService.searchProfiles(queryOptions);

  res.status(200).json(buildProfileListResponse(req, queryOptions, result));
});

export const exportProfilesCsv = asyncHandler(async (req, res) => {
  const queryOptions = validateExportQuery(req.query);
  const profiles = await profileService.exportProfiles(queryOptions);
  const filename = createProfilesCsvFilename();

  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(serializeProfilesCsv(profiles));
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
