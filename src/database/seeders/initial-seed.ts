import { modelRegistry } from '../models/model.registry';
import { databaseService } from '../services/database.service';
import { mockUserProfile } from '@/data/mockProfile';
import { mockExpenses } from '@/utils/initMockData';

export async function seedInitialData() {
  try {
    await databaseService.connect();

    // Insert users
    const User = modelRegistry.getModel('User');
    const userInsertResult = await User?.insertMany([mockUserProfile], { ordered: false }) ?? [];
    console.log(`Inserted ${userInsertResult.length} users`);

    // Insert transactions
    // Insert user
    const User = modelRegistry.getModel('User');
    const userInsertResult = await User?.insertMany([mockUserProfile], { ordered: false }) ?? [];
    console.log(`Inserted ${userInsertResult.length} users`);

    // Insert expenses with user reference
    const Expense = modelRegistry.getModel('Expense');
    const expensesWithUser = mockExpenses.map(expense => ({
      ...expense,
      user: userInsertResult[0]._id,
      date: new Date(expense.date)
    }));

    const insertedExpenses = await Expense?.insertMany(expensesWithUser, { ordered: false });
    console.log(`Inserted ${insertedExpenses?.length ?? 0} expenses`);

    // Update user with expense references
    await User?.updateOne(
      { _id: userInsertResult[0]._id },
      { $push: { expenses: { $each: insertedExpenses?.map(e => e._id) ?? [] } } }
    );

    // Insert groups (if any mock groups exist)
    const Group = modelRegistry.getModel('Group');
    const existingGroups = await Group?.countDocuments() ?? 0;
    if (existingGroups === 0) {
      // Add group insertion logic here when mock groups are available
      console.log('No groups to insert');
    }

    await databaseService.disconnect();
    return true;
  } catch (error) {
    console.error('Seed failed:', error);
    await databaseService.disconnect();
    return false;
  }
}