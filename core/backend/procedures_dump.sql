-------------------------------------------------
-- sp_CreateUser
-------------------------------------------------

CREATE PROCEDURE [dbo].[sp_CreateUser]
    @Username NVARCHAR(255),
    @Password NVARCHAR(255),
    @Email NVARCHAR(255) = '',
    @Referent NVARCHAR(255),
    @Phone NVARCHAR(50) = '',
    @RoleId INT = 1
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if username already exists
    IF EXISTS (SELECT 1 FROM MP_T_USER WHERE Usr_Login = @Username)
    BEGIN
        -- Return error code
        SELECT -1 as Result, 'Username already exists' as ErrorMessage
        RETURN
    END

    -- Insert new user
    INSERT INTO MP_T_USER (
        Usr_Login,
        Usr_Pwd,
        Usr_Ref_Mail,
        Usr_Referent,
        Usr_Ref_Tel,
        Usr_Rol_Id,
        Usr_IsValid,
        Usr_Recovery
    )
    VALUES (
        @Username,
        @Password,
        @Email,
        @Referent,
        @Phone,
        @RoleId,
        -1,
        0
    )

    -- Return the newly created user
    SELECT
        Usr_Code as Id,
        Usr_Login as Username,
        Usr_Referent as Referent,
        Usr_Ref_Mail as Email,
        Usr_Ref_Tel as Phone,
        Usr_Rol_Id as RoleId,
        Usr_IsValid as IsValid,
        Usr_Recovery as Recovery,
        Usr_Recovery_OTP as RecoveryOTP
    FROM MP_T_USER
    WHERE Usr_Code = SCOPE_IDENTITY()
END


-------------------------------------------------
-- sp_UpdateUser
-------------------------------------------------
CREATE PROCEDURE [dbo].[sp_UpdateUser]
    @UserId INT,
    @Username NVARCHAR(255),
    @Password NVARCHAR(255) = NULL,
    @Referent NVARCHAR(255) = NULL,
    @Email NVARCHAR(255) = NULL,
    @Phone NVARCHAR(255) = NULL,
    @RoleId INT = NULL,
    @Recovery INT = NULL,
    @RecoveryOTP NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM MP_T_USER WHERE Usr_Code = @UserId AND Usr_IsValid = -1)
    BEGIN
        SELECT -1 as Result, 'User not found' as ErrorMessage
        RETURN
    END

    -- Update user
    UPDATE MP_T_USER
    SET
        Usr_Login = @Username,
        Usr_Pwd = CASE WHEN @Password IS NOT NULL AND @Password != '' THEN @Password ELSE Usr_Pwd END,
        Usr_Referent = ISNULL(@Referent, Usr_Referent),
        Usr_Ref_Mail = ISNULL(@Email, Usr_Ref_Mail),
        Usr_Ref_Tel = ISNULL(@Phone, Usr_Ref_Tel),
        Usr_Rol_Id = ISNULL(@RoleId, Usr_Rol_Id),
        Usr_Recovery = ISNULL(@Recovery, Usr_Recovery),
        Usr_Recovery_OTP = ISNULL(@RecoveryOTP, Usr_Recovery_OTP),
        Usr_First_Login = CASE WHEN @Password IS NOT NULL AND @Password != '' THEN 0 ELSE Usr_First_Login END
    WHERE Usr_Code = @UserId

    -- Return updated user with role name
    SELECT
        u.Usr_Code as Id,
        u.Usr_Login as Username,
        u.Usr_Referent as Referent,
        u.Usr_Ref_Mail as Email,
        u.Usr_Ref_Tel as Phone,
        u.Usr_Rol_Id as RoleId,
        r.Rol_Descrizione as RoleName,
        u.Usr_IsValid as IsValid,
        u.Usr_Recovery as Recovery,
        u.Usr_Recovery_OTP as RecoveryOTP
    FROM MP_T_USER u
    LEFT JOIN MP_T_ROLES r ON u.Usr_Rol_Id = r.Rol_Id
    WHERE u.Usr_Code = @UserId
END


-------------------------------------------------
-- sp_UserLogin
-------------------------------------------------

CREATE PROCEDURE [dbo].[sp_UserLogin]
    @Username NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.Usr_Code,
        u.Usr_Login,
        u.Usr_Pwd,
        u.Usr_Referent,
        u.Usr_Ref_Mail,
        u.Usr_Ref_Tel,
        u.Usr_Rol_Id,
        u.Usr_IsValid,
        u.Usr_First_Login,
        r.Rol_Descrizione AS RoleName
    FROM MP_T_USER u
    LEFT JOIN MP_T_ROLES r ON u.Usr_Rol_Id = r.Rol_Id
    WHERE u.Usr_Login = @Username
        AND u.Usr_IsValid = -1;
END


-------------------------------------------------
-- sp_GetAllUsers
-------------------------------------------------
CREATE PROCEDURE [dbo].[sp_GetAllUsers] AS BEGIN SET NOCOUNT ON; SELECT u.Usr_Code as Id, u.Usr_Login as Username, u.Usr_Referent as Referent, u.Usr_Ref_Mail as Email, u.Usr_Ref_Tel as Phone, u.Usr_Rol_Id as RoleId, r.Rol_Descrizione as RoleName, u.Usr_IsValid as IsValid, u.Usr_Recovery as Recovery, u.Usr_Recovery_OTP as RecoveryOTP FROM MP_T_USER u LEFT JOIN MP_T_ROLES r ON u.Usr_Rol_Id = r.Rol_Id WHERE u.Usr_IsValid = -1 ORDER BY u.Usr_Code END


-------------------------------------------------
-- sp_GetUserById
-------------------------------------------------
CREATE PROCEDURE [dbo].[sp_GetUserById] @UserId INT AS BEGIN SET NOCOUNT ON; SELECT Usr_Code as Id, Usr_Login as Username, Usr_Pwd as Password, Usr_Referent as Referent, Usr_Ref_Mail as Email, Usr_Ref_Tel as Phone, Usr_Rol_Id as RoleId, Usr_IsValid as IsValid, Usr_Recovery as Recovery, Usr_Recovery_OTP as RecoveryOTP FROM MP_T_USER WHERE Usr_Code = @UserId AND Usr_IsValid = -1 END


-------------------------------------------------
-- sp_GetAllRoles
-------------------------------------------------

-- Create procedure
CREATE PROCEDURE sp_GetAllRoles
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        Rol_Id as Id,
        Rol_Descrizione as Description
    FROM MP_T_ROLES
    ORDER BY Rol_Id
END


