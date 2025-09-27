const { Client, Environment, LogLevel, OrdersController, PaymentsController } = require('@paypal/paypal-server-sdk');

class PayPalService {
    constructor() {
        // Initialize PayPal client
        this.client = new Client({
            clientCredentialsAuthCredentials: {
                oAuthClientId: process.env.PAYPAL_CLIENT_ID,
                oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET
            },
            timeout: 0,
            environment: process.env.PAYPAL_MODE === 'live' ? Environment.Production : Environment.Sandbox,
            logging: {
                logLevel: LogLevel.Info,
                logRequest: {
                    logBody: true
                },
                logResponse: {
                    logHeaders: true
                }
            }
        });
        
        this.ordersController = new OrdersController(this.client);
        this.paymentsController = new PaymentsController(this.client);
        
        this.currency = process.env.PAYPAL_CURRENCY || 'EUR';
        this.premiumAmount = process.env.PAYPAL_PREMIUM_AMOUNT || '9.99';
    }

    /**
     * Create a PayPal order for premium subscription
     * @param {Object} orderData - Order details
     * @param {string} orderData.userId - User ID
     * @param {string} orderData.email - User email
     * @param {string} orderData.amount - Payment amount (optional, defaults to premium amount)
     * @returns {Object} PayPal order response
     */
    async createOrder(orderData) {
        try {
            const { userId, email, amount = this.premiumAmount } = orderData;
            
            const request = {
                body: {
                    intent: 'CAPTURE',
                    purchaseUnits: [{
                        referenceId: `globalscout_premium_${userId}`,
                        amount: {
                            currencyCode: this.currency,
                            value: amount
                        },
                        description: 'GlobalScout Premium Subscription',
                        customId: userId.toString(),
                        invoiceId: `GS_${Date.now()}_${userId}`
                    }],
                    applicationContext: {
                        brandName: 'GlobalScout',
                        landingPage: 'BILLING',
                        userAction: 'PAY_NOW',
                        returnUrl: `${process.env.FRONTEND_URL}/payment/success`,
                        cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`
                    },
                    payer: {
                        emailAddress: email
                    }
                }
            };

            const response = await this.ordersController.createOrder(request);
            
            if (response.statusCode === 201) {
                return {
                    success: true,
                    orderId: response.result.id,
                    approvalUrl: response.result.links.find(link => link.rel === 'approve')?.href,
                    order: response.result
                };
            } else {
                throw new Error(`PayPal order creation failed: ${response.statusCode}`);
            }
        } catch (error) {
            console.error('PayPal createOrder error:', error);
            throw new Error(`Failed to create PayPal order: ${error.message}`);
        }
    }

    /**
     * Capture a PayPal order after approval
     * @param {string} orderId - PayPal order ID
     * @returns {Object} Capture response
     */
    async captureOrder(orderId) {
        try {
            const request = {
                id: orderId,
                body: {}
            };

            const response = await this.ordersController.captureOrder(request);
            
            if (response.statusCode === 201) {
                const captureData = response.result;
                const captureId = captureData.purchase_units[0]?.payments?.captures[0]?.id;
                const status = captureData.status;
                const userId = captureData.purchase_units[0]?.custom_id;
                
                return {
                    success: true,
                    captureId,
                    status,
                    userId,
                    amount: captureData.purchase_units[0]?.payments?.captures[0]?.amount,
                    captureData
                };
            } else {
                throw new Error(`PayPal order capture failed: ${response.statusCode}`);
            }
        } catch (error) {
            console.error('PayPal captureOrder error:', error);
            throw new Error(`Failed to capture PayPal order: ${error.message}`);
        }
    }

    /**
     * Get order details
     * @param {string} orderId - PayPal order ID
     * @returns {Object} Order details
     */
    async getOrderDetails(orderId) {
        try {
            const request = { id: orderId };
            const response = await this.ordersController.getOrder(request);
            
            if (response.statusCode === 200) {
                return {
                    success: true,
                    order: response.result
                };
            } else {
                throw new Error(`Failed to get order details: ${response.statusCode}`);
            }
        } catch (error) {
            console.error('PayPal getOrderDetails error:', error);
            throw new Error(`Failed to get order details: ${error.message}`);
        }
    }

    /**
     * Verify webhook signature (for production use)
     * @param {Object} headers - Request headers
     * @param {string} body - Request body
     * @returns {boolean} Verification result
     */
    async verifyWebhookSignature(headers, body) {
        try {
            // PayPal webhook verification logic
            // This is a simplified version - in production, implement proper verification
            const authAlgo = headers['paypal-auth-algo'];
            const transmission = headers['paypal-transmission-id'];
            const certId = headers['paypal-cert-id'];
            const signature = headers['paypal-transmission-sig'];
            const timestamp = headers['paypal-transmission-time'];
            
            // For now, return true for development
            // In production, implement proper PayPal webhook verification
            return process.env.PAYPAL_MODE === 'sandbox' ? true : false;
        } catch (error) {
            console.error('PayPal webhook verification error:', error);
            return false;
        }
    }

    /**
     * Handle webhook events
     * @param {Object} event - PayPal webhook event
     * @returns {Object} Processing result
     */
    async handleWebhookEvent(event) {
        try {
            const { event_type, resource } = event;
            
            switch (event_type) {
                case 'PAYMENT.CAPTURE.COMPLETED':
                    return await this.handlePaymentCompleted(resource);
                case 'PAYMENT.CAPTURE.DENIED':
                    return await this.handlePaymentDenied(resource);
                case 'PAYMENT.CAPTURE.REFUNDED':
                    return await this.handlePaymentRefunded(resource);
                default:
                    console.log(`Unhandled PayPal webhook event: ${event_type}`);
                    return { success: true, message: 'Event logged' };
            }
        } catch (error) {
            console.error('PayPal webhook handling error:', error);
            throw new Error(`Failed to handle webhook: ${error.message}`);
        }
    }

    /**
     * Handle completed payment
     * @param {Object} resource - Payment resource
     * @returns {Object} Processing result
     */
    async handlePaymentCompleted(resource) {
        try {
            const userId = resource.custom_id;
            const amount = resource.amount;
            const captureId = resource.id;
            
            console.log(`Payment completed for user ${userId}: ${amount.value} ${amount.currency_code}`);
            
            // Here you would update the user's subscription status in your database
            // Example: await subscriptionService.activatePremium(userId, captureId);
            
            return {
                success: true,
                message: 'Payment processed successfully',
                userId,
                captureId
            };
        } catch (error) {
            console.error('Error handling payment completion:', error);
            throw error;
        }
    }

    /**
     * Handle denied payment
     * @param {Object} resource - Payment resource
     * @returns {Object} Processing result
     */
    async handlePaymentDenied(resource) {
        try {
            const userId = resource.custom_id;
            console.log(`Payment denied for user ${userId}`);
            
            return {
                success: true,
                message: 'Payment denial logged',
                userId
            };
        } catch (error) {
            console.error('Error handling payment denial:', error);
            throw error;
        }
    }

    /**
     * Handle refunded payment
     * @param {Object} resource - Payment resource
     * @returns {Object} Processing result
     */
    async handlePaymentRefunded(resource) {
        try {
            const userId = resource.custom_id;
            console.log(`Payment refunded for user ${userId}`);
            
            // Here you would update the user's subscription status
            // Example: await subscriptionService.deactivatePremium(userId);
            
            return {
                success: true,
                message: 'Refund processed',
                userId
            };
        } catch (error) {
            console.error('Error handling payment refund:', error);
            throw error;
        }
    }
}

module.exports = new PayPalService();