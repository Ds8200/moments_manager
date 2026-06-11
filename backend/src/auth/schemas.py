from pydantic import BaseModel, EmailStr


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class MagicLoginSchema(BaseModel):
    token: str


class TokenResponseSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
