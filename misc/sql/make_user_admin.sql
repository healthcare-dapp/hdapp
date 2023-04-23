UPDATE user_entity
SET "hasAdministratorCapabilities"=True
WHERE "id"=4;

UPDATE user_entity
SET "hasModeratorCapabilities"=True
WHERE "id"=4;

UPDATE user_entity
SET "password"='123'
WHERE "id"=4;