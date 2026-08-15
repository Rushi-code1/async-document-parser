from typing import List, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime

# Auth Schemas
class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Structured Output Schemas for Gemini / Extraction
class LineItem(BaseModel):
    item_name: str = Field(description="Name or description of the product or service")
    quantity: int = Field(default=1, description="Quantity of items")
    unit_price: float = Field(default=0.0, description="Price per unit")
    total: float = Field(default=0.0, description="Subtotal for this line item")

class InvoiceData(BaseModel):
    vendor_name: str = Field(description="Name of vendor, merchant, or company issuing invoice")
    invoice_number: str = Field(description="Invoice or receipt reference number")
    invoice_date: str = Field(description="Date invoice was issued (YYYY-MM-DD format if possible)")
    line_items: List[LineItem] = Field(default_factory=list, description="List of items/services purchased")
    tax: float = Field(default=0.0, description="Tax or VAT amount")
    total_amount: float = Field(default=0.0, description="Final total amount charged")

# Task Schemas
class TaskResponse(BaseModel):
    task_id: str
    filename: str
    status: str
    created_at: datetime
    extracted_data: Optional[Any] = None

    class Config:
        from_attributes = True

class TaskUpdate(BaseModel):
    extracted_data: Any
