import { Schema, model } from 'mongoose';

interface IExpense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  isRecurring: boolean;
  paymentMethod: string;
  createdAt: string;
}

const expenseSchema = new Schema<IExpense>({
  id: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: String, required: true },
  description: { type: String, required: true },
  isRecurring: { type: Boolean, required: true },
  paymentMethod: { type: String, required: true },
  createdAt: { type: String, required: true }
});

export const Expense = model<IExpense>('Expense', expenseSchema);