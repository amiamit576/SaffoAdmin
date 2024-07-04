const emailValidator = require("email-validator");
const bcrypt = require("bcrypt");
const { body, validationResult } = require('express-validator');
const connection = require('../config/databseConfig'); // Import your MySQL connection object
const { promisify } = require('util');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken


// Promisify the query method
const query = promisify(connection.query).bind(connection);

const signUp = async (req, res, next) => {
    const { employeeId, username, email, password, confirmPassword, countryCode, phoneNumber } = req.body;
    console.log(employeeId, username, email, password, confirmPassword, countryCode, phoneNumber);

    const signupValidationRules = () => {
        return [
            body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Enter a valid email address'),
            body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
            body('username').notEmpty().withMessage('Username is required').isLength({ min: 2 }).withMessage('Username must be at least 2 characters long'),
            body('phoneNumber').notEmpty().withMessage('Phone number is required').isLength({ min: 10, max: 10 }).withMessage('Phone number must be exactly 10 digits long').isNumeric().withMessage('Phone number must be numeric')
        ];
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const validEmail = emailValidator.validate(email);
    if (!validEmail) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address 📩"
        });
    }

    try {
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password and confirm password do not match ❌"
            });
        }

        const checkEmailQuery = 'SELECT COUNT(*) AS count FROM employee WHERE email = ?';
        const emailExists = await query(checkEmailQuery, [email]);
        if (emailExists[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: `Account already exists with the provided email ${email} 😒`
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const insertUserQuery = 'INSERT INTO employee (employeeId, username, email, password, countryCode, phoneNumber) VALUES (?, ?, ?, ?, ?, ?)';
        const result = await query(insertUserQuery, [employeeId, username, email, hashedPassword, countryCode, phoneNumber]);
        console.log("Insert Result:", result);

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
};



/*
    signIn

*/





const signIn = async (req, res, next) => {
    const { employeeId, password } = req.body;
    console.log("Received employeeId:", employeeId);
    console.log("Received password:", password);

    try {
        // Ensure the connection is available and query returns expected results
        const sql = 'SELECT * FROM employee WHERE employeeId = ?';
        const results = await query(sql, [employeeId]);
        console.log("Results:", results);

        if (!results || results.length === 0) {
            return res.status(400).json({ success: false, message: 'Employee not found' });
        }

        const user = results[0];
        console.log("User:", user);

        if (!user || !user.password) {
            return res.status(400).json({ success: false, message: 'Invalid employee data' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log("IsValidPassword:", isValidPassword);

        if (!isValidPassword) {
            return res.status(400).json({ success: false, message: 'Invalid password' });
        }

        // Generate a JWT token
        const token = jwt.sign({ employeeId: user.employeeId }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });
        console.log("Token:", token);

        return res.status(200).json({ success: true, data: { employeeId: user.employeeId, token: token } });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    signUp,
    signIn
}
