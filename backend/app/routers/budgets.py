from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from ..database import get_db
from ..models import CategoryGroup, Category, Budget, TransactionModel as Transaction, ReadyToAssign, UserModel
from ..schemas.category_group import CategoryGroupCreate, CategoryGroup as CategoryGroupSchema
from ..schemas.category import CategoryCreate, Category as CategorySchema, CategoryUpdate
from ..schemas.budget import BudgetCreate, Budget as BudgetSchema
from ..schemas.transaction import TransactionCreate, Transaction as TransactionSchema, TransactionUpdate
from ..core.firebase import get_current_user
from typing import List, Dict
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Category Group Routes
@router.post("/category-groups/", response_model=List[CategoryGroupSchema])
async def create_category_group(
    group: CategoryGroupCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_group = CategoryGroup(**group.model_dump(), user_id=current_user["uid"])
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db.query(CategoryGroup).filter(CategoryGroup.user_id == current_user["uid"]).all()

@router.get("/category-groups/", response_model=List[CategoryGroupSchema])
def get_category_groups(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Getting category groups for user: {current_user['uid']}")
    try:
        groups = db.query(CategoryGroup).filter(CategoryGroup.user_id == current_user["uid"]).all()
        logger.info(f"Found {len(groups)} category groups")
        return groups
    except Exception as e:
        logger.error(f"Error getting category groups: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Category Routes
@router.get("/categories/", response_model=List[CategorySchema])
def get_categories(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Getting categories for user: {current_user['uid']}")
    try:
        categories = db.query(Category).filter(Category.user_id == current_user["uid"]).all()
        logger.info(f"Found {len(categories)} categories")
        return categories
    except Exception as e:
        logger.error(f"Error getting categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/categories/", response_model=CategorySchema)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Creating category for user: {current_user['uid']}")
    try:
        db_category = Category(**category.model_dump(), user_id=current_user["uid"])
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        logger.info(f"Category created: {db_category.id}")
        return db_category
    except Exception as e:
        logger.error(f"Error creating category: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/categories/{category_id}", response_model=CategorySchema)
async def update_category(
    category_id: int, 
    category_data: CategoryUpdate, 
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Updating category {category_id} for user: {current_user['uid']}")
    try:
        db_category = db.query(Category).filter(Category.id == category_id, Category.user_id == current_user["uid"]).first()
        if not db_category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        for key, value in category_data.model_dump(exclude_unset=True).items():
            setattr(db_category, key, value)
        
        db.commit()
        db.refresh(db_category)
        logger.info(f"Category {category_id} updated successfully")
        return db_category
    except Exception as e:
        logger.error(f"Error updating category: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Budget Routes
@router.get("/budgets/", response_model=List[BudgetSchema])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Getting budgets for user: {current_user['uid']}")
    try:
        budgets = db.query(Budget).filter(Budget.user_id == current_user["uid"]).all()
        logger.info(f"Found {len(budgets)} budgets")
        return budgets
    except Exception as e:
        logger.error(f"Error getting budgets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/budgets/", response_model=BudgetSchema)
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Creating budget for user: {current_user['uid']}")
    try:
        db_budget = Budget(**budget.model_dump(), user_id=current_user["uid"])
        db.add(db_budget)
        db.commit()
        db.refresh(db_budget)
        logger.info(f"Budget created: {db_budget.id}")
        return db_budget
    except Exception as e:
        logger.error(f"Error creating budget: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Ready to Assign Routes
@router.get("/ready-to-assign/")
def get_ready_to_assign(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Calculating ready to assign for user: {current_user['uid']}")
    try:
        ready_to_assign = db.query(ReadyToAssign).filter(ReadyToAssign.user_id == current_user["uid"]).first()
        if not ready_to_assign:
            ready_to_assign = ReadyToAssign(user_id=current_user["uid"])
            db.add(ready_to_assign)
            db.commit()
            db.refresh(ready_to_assign)
        logger.info(f"Ready to assign amount: {ready_to_assign.amount}")
        return {"ready_to_assign": float(ready_to_assign.amount)}
    except Exception as e:
        logger.error(f"Error calculating ready to assign: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/ready-to-assign/")
def update_ready_to_assign(
    amount: float,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Updating ready to assign for user: {current_user['uid']}")
    try:
        ready_to_assign = db.query(ReadyToAssign).filter(ReadyToAssign.user_id == current_user["uid"]).first()
        if not ready_to_assign:
            ready_to_assign = ReadyToAssign(user_id=current_user["uid"], amount=amount)
            db.add(ready_to_assign)
        else:
            ready_to_assign.amount = amount
        db.commit()
        db.refresh(ready_to_assign)
        logger.info(f"Updated ready to assign amount: {ready_to_assign.amount}")
        return {"ready_to_assign": float(ready_to_assign.amount)}
    except Exception as e:
        logger.error(f"Error updating ready to assign: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Transaction Routes
@router.post("/transactions/", response_model=TransactionSchema)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_transaction = Transaction(**transaction.model_dump(), user_id=current_user["uid"])
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    if db_transaction.category_id:
        update_budget_for_transaction(db, db_transaction, current_user["uid"])

    return db_transaction

@router.get("/transactions/", response_model=List[TransactionSchema])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user["uid"]
    ).offset(skip).limit(limit).all()
    return transactions

@router.get("/transactions/{transaction_id}", response_model=TransactionSchema)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    transaction = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id,
        Transaction.user_id == current_user["uid"]
    ).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.put("/transactions/{transaction_id}", response_model=TransactionSchema)
def update_transaction(
    transaction_id: str,
    transaction_update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_transaction = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id,
        Transaction.user_id == current_user["uid"]
    ).first()
    
    logger.info(f"Received update request for transaction {transaction_id}: {transaction_update}")
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Si la categoría ha cambiado, actualizamos el presupuesto
    if transaction_update.category_id is not None and transaction_update.category_id != db_transaction.category_id:
        # Primero, revertimos el efecto en el presupuesto anterior si existía
        if db_transaction.category_id:
            update_budget_for_transaction(db, db_transaction, current_user["uid"], reverse=True)
        
        # Luego, actualizamos la categoría
        db_transaction.category_id = transaction_update.category_id
        
        # Finalmente, actualizamos el nuevo presupuesto
        update_budget_for_transaction(db, db_transaction, current_user["uid"])

    # Actualizamos los demás campos
    for key, value in transaction_update.model_dump(exclude_unset=True).items():
        setattr(db_transaction, key, value)

    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.delete("/transactions/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_transaction = db.query(Transaction).filter(
        Transaction.transaction_id == transaction_id,
        Transaction.user_id == current_user["uid"]
    ).first()
    
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Si la transacción tenía una categoría, actualizamos el presupuesto
    if db_transaction.category_id:
        update_budget_for_transaction(db, db_transaction, current_user["uid"], reverse=True)

    db.delete(db_transaction)
    db.commit()
    return {"detail": "Transaction deleted successfully"}

def update_budget_for_transaction(db: Session, transaction: Transaction, user_id: str, reverse: bool = False):
    budget = db.query(Budget).filter(
        Budget.category_id == transaction.category_id,
        Budget.user_id == user_id,
        Budget.period_start <= transaction.timestamp.date(),
        Budget.period_end >= transaction.timestamp.date()
    ).first()

    if budget:
        amount = transaction.amount if not reverse else -transaction.amount
        budget.spent_amount += amount
        db.commit()


# Utility function for updating budgets
def update_budget_for_transaction(db: Session, transaction: Transaction, user_id: str, reverse: bool = False):
    budget = db.query(Budget).filter(
        Budget.category_id == transaction.category_id,
        Budget.user_id == user_id,
        Budget.period_start <= transaction.timestamp.date(),
        Budget.period_end >= transaction.timestamp.date()
    ).first()

    if budget:
        amount = transaction.amount if not reverse else -transaction.amount
        budget.spent_amount += amount
        db.commit()

@router.get("/categories/spent", response_model=Dict[int, float])
def get_spent_by_category(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    spent_by_category = db.query(
        Transaction.category_id,
        func.sum(Transaction.amount).label("total_spent")
    ).filter(
        Transaction.user_id == current_user["uid"],
        Transaction.amount < 0,  # Asumiendo que los gastos son negativos
        Transaction.category_id.isnot(None)  # Excluir transacciones sin categoría
    ).group_by(Transaction.category_id).all()

    return {item.category_id: abs(item.total_spent) for item in spent_by_category}

