import { BaseModel } from './BaseModel';
import { User, Student, UserReputation } from '../types';

export class UserModel extends BaseModel {
  /**
   * Create a new user
   */
  async createUser(userData: Omit<User, 'userID' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const userID = this.generateId('user_');
    const now = new Date().toISOString();

    const result = await this.execute(
      `INSERT INTO User (
        userID, email, name, phone, profileImage, isVerified, 
        preferredLanguage, isAdmin, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userID,
        userData.email,
        userData.name,
        userData.phone || null,
        userData.profileImage || null,
        userData.isVerified,
        userData.preferredLanguage,
        userData.isAdmin,
        userData.status,
        now,
        now
      ]
    );

    if (result.changes === 0) {
      throw new Error('Failed to create user');
    }

    const user = await this.getUserById(userID);
    if (!user) {
      throw new Error('Failed to retrieve created user');
    }
    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(userID: string): Promise<User | null> {
    return await this.queryOne('SELECT * FROM User WHERE userID = ?', [userID]);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return await this.queryOne('SELECT * FROM User WHERE email = ?', [email]);
  }

  /**
   * Update user information
   */
  async updateUser(userID: string, updates: Partial<User>): Promise<User> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Build dynamic update query
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'userID' && key !== 'createdAt' && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add updatedAt timestamp
    updateFields.push('updatedAt = ?');
    updateValues.push(new Date().toISOString());
    updateValues.push(userID);

    const sql = `UPDATE User SET ${updateFields.join(', ')} WHERE userID = ?`;
    const result = await this.execute(sql, updateValues);

    if (result.changes === 0) {
      throw new Error('User not found or no changes made');
    }

    const user = await this.getUserById(userID);
    if (!user) {
      throw new Error('Failed to retrieve updated user');
    }
    return user;
  }

  /**
   * Delete user (soft delete by setting status to 'deleted')
   */
  async deleteUser(userID: string): Promise<boolean> {
    const result = await this.execute(
      'UPDATE User SET status = ?, updatedAt = ? WHERE userID = ?',
      ['deleted', new Date().toISOString(), userID]
    );

    return result.changes > 0;
  }

  /**
   * Create student record for a user
   */
  async createStudent(studentData: Omit<Student, 'studentID' | 'verificationDate'>): Promise<Student> {
    const studentID = this.generateId('student_');
    const now = new Date().toISOString();

    const result = await this.execute(
      `INSERT INTO Student (studentID, userID, schoolName, grade, studentEmail, verificationDate)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        studentID,
        studentData.userID,
        studentData.schoolName,
        studentData.grade || null,
        studentData.studentEmail,
        now
      ]
    );

    if (result.changes === 0) {
      throw new Error('Failed to create student record');
    }

    const student = await this.getStudentById(studentID);
    if (!student) {
      throw new Error('Failed to retrieve created student');
    }
    return student;
  }

  /**
   * Get student record by ID
   */
  async getStudentById(studentID: string): Promise<Student | null> {
    return await this.queryOne('SELECT * FROM Student WHERE studentID = ?', [studentID]);
  }

  /**
   * Get student record by user ID
   */
  async getStudentByUserId(userID: string): Promise<Student | null> {
    return await this.queryOne('SELECT * FROM Student WHERE userID = ?', [userID]);
  }

  /**
   * Get student record by email
   */
  async getStudentByEmail(studentEmail: string): Promise<Student | null> {
    return await this.queryOne('SELECT * FROM Student WHERE studentEmail = ?', [studentEmail]);
  }

  /**
   * Check if email domain is in university whitelist
   */
  async isUniversityEmail(email: string): Promise<boolean> {
    const domain = email.split('@')[1];
    if (!domain) return false;

    const result = await this.queryOne(
      'SELECT id FROM UniversityWhitelist WHERE domain = ? AND isActive = 1',
      [domain]
    );

    return !!result;
  }

  /**
   * Check if email domain is in university whitelist
   */
  async isUniversityEmailDomain(domain: string): Promise<boolean> {
    const result = await this.queryOne(
      'SELECT id FROM UniversityWhitelist WHERE domain = ? AND isActive = 1',
      [domain]
    );

    return !!result;
  }

  /**
   * Get user reputation information
   */
  async getUserReputation(userID: string): Promise<UserReputation> {
    // Get average ratings as buyer and seller
    const buyerRating = await this.queryOne(
      `SELECT AVG(rating) as avgRating, COUNT(*) as count 
       FROM Review WHERE targetUserID = ? AND reviewType = 'seller_to_buyer'`,
      [userID]
    );

    const sellerRating = await this.queryOne(
      `SELECT AVG(rating) as avgRating, COUNT(*) as count 
       FROM Review WHERE targetUserID = ? AND reviewType = 'buyer_to_seller'`,
      [userID]
    );

    // Get completed transactions count
    const transactionCount = await this.queryOne(
      `SELECT COUNT(*) as count FROM Deal 
       WHERE (buyerID = ? OR sellerID = ?) AND status = 'completed'`,
      [userID, userID]
    );

    const totalReviews = (buyerRating?.count || 0) + (sellerRating?.count || 0);
    const overallRating = totalReviews > 0 
      ? ((buyerRating?.avgRating || 0) * (buyerRating?.count || 0) + 
         (sellerRating?.avgRating || 0) * (sellerRating?.count || 0)) / totalReviews
      : 0;

    return {
      userID,
      averageRating: Math.round(overallRating * 100) / 100,
      totalReviews,
      completedTransactions: transactionCount?.count || 0,
      buyerRating: Math.round((buyerRating?.avgRating || 0) * 100) / 100,
      sellerRating: Math.round((sellerRating?.avgRating || 0) * 100) / 100
    };
  }

  /**
   * Get all users with pagination
   */
  async getUsers(page: number = 1, limit: number = 20): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit;

    const users = await this.query(
      'SELECT * FROM User WHERE status != ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      ['deleted', limit, offset]
    );

    const totalResult = await this.queryOne(
      'SELECT COUNT(*) as count FROM User WHERE status != ?',
      ['deleted']
    );

    return {
      users,
      total: totalResult?.count || 0
    };
  }
}