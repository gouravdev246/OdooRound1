from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints


Password = Annotated[str, StringConstraints(min_length=8, max_length=128)]


class SignupRequest(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
    email: EmailStr
    password: Password


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: Annotated[str, StringConstraints(pattern=r"^\d{6}$")]


class ResetPasswordRequest(VerifyOTPRequest):
    new_password: Password


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: EmailStr
    role: str


class SignupResponse(BaseModel):
    message: str
    user: UserResponse


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    message: str