-- Tên thư mục không trùng trong cùng một người dùng.
CREATE UNIQUE INDEX "Folder_ownerId_name_key" ON "Folder"("ownerId", "name");
