
import { createClient } from '@supabase/supabase-js';

// Types mimicking Supabase response
type PostgrestSingleResponse<T> = {
    data: T | null;
    error: null | { message: string, details: string, hint: string, code: string };
    count: number | null;
    status: number;
    statusText: string;
};

type PostgrestResponse<T> = {
    data: T[] | null;
    error: null | { message: string, details: string, hint: string, code: string };
    count: number | null;
    status: number;
    statusText: string;
};

// New Order type based on the provided structure
interface Order {
    id: number;
    user_id: string;
    service_id: number;
    status: 'completed' | 'processing' | 'pending' | 'cancelled'; // Example statuses
    amount: number;
    link: string;
    quantity: number;
    custom_inputs?: Record<string, string>;
    created_at: string;
    updated_at?: string;
    fulfillment_data?: {
        text?: string;
        files?: { name: string; url: string }[];
    } | null;
}

// Seed data
const INITIAL_CATEGORIES = [
    { id: 1, name: 'Instagram', slug: 'instagram', icon: 'Instagram', sort_order: 1, is_active: true, created_at: new Date().toISOString() },
    { id: 2, name: 'YouTube', slug: 'youtube', icon: 'Youtube', sort_order: 2, is_active: true, created_at: new Date().toISOString() },
    { id: 3, name: 'TikTok', slug: 'tiktok', icon: 'Video', sort_order: 3, is_active: true, created_at: new Date().toISOString() },
];

const INITIAL_SERVICES = [
    {
        id: 1,
        name: 'Instagram Followers (Real)',
        type: 'smm',
        category_id: 1,
        price_per_1000: 5.00,
        min_quantity: 1,
        max_quantity: 10000,
        description: 'High quality real followers',
        is_active: true,
        input_schema: ['link', 'quantity'],
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        name: 'YouTube Views',
        type: 'smm',
        category_id: 2,
        price_per_1000: 2.50,
        min_quantity: 1,
        max_quantity: 50000,
        description: 'Fast retention views',
        is_active: true,
        input_schema: ['link', 'quantity'],
        created_at: new Date().toISOString()
    }
];

const INITIAL_PROFILES = [
    {
        id: 'user-123',
        email: 'user@example.com',
        role: 'user',
        balance: 100.00,
        is_active: true,
        created_at: new Date().toISOString()
    },
    {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        balance: 9999.99,
        is_active: true,
        created_at: new Date().toISOString()
    }
];

const INITIAL_USER_ROLES = [
    {
        id: 'role-1',
        user_id: 'user-123',
        role: 'user',
        created_at: new Date().toISOString()
    },
    {
        id: 'role-2',
        user_id: 'admin-123',
        role: 'admin',
        created_at: new Date().toISOString()
    }
];

const INITIAL_ORDERS: Order[] = [
    {
        id: 1001,
        user_id: 'user-123',
        service_id: 1,
        status: 'completed',
        amount: 15.00,
        link: 'https://instagram.com/p/123',
        quantity: 1000,
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
        fulfillment_data: {
            text: "<p>Order <b>completed</b> successfully!</p>",
            files: []
        }
    },
    {
        id: 1002,
        user_id: 'user-123',
        service_id: 1,
        status: 'processing',
        amount: 7.50,
        link: 'https://instagram.com/p/456',
        quantity: 500,
        updated_at: new Date(Date.now() - 43200000).toISOString(),
        created_at: new Date(Date.now() - 43200000).toISOString(),
    },
    {
        id: 1003,
        user_id: 'user-123',
        service_id: 2,
        status: 'pending',
        amount: 25.00,
        link: 'https://youtube.com/watch?v=xyz',
        quantity: 2000,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
    },
];

class MockDB {
    public storagePrefix = 'mock_db_';
    private tables: Record<string, any[]> = {};

    constructor() {
        this.loadFromStorage();
        if (!this.tables['categories'] || this.tables['categories'].length === 0) {
            this.tables['categories'] = INITIAL_CATEGORIES;
            this.saveToStorage('categories');
        }
        if (!this.tables['services'] || this.tables['services'].length === 0) {
            this.tables['services'] = INITIAL_SERVICES;
            this.saveToStorage('services');
        }
        if (!this.tables['profiles'] || this.tables['profiles'].length === 0) {
            this.tables['profiles'] = INITIAL_PROFILES;
            this.saveToStorage('profiles');
        }
        if (!this.tables['orders'] || this.tables['orders'].length === 0) {
            this.tables['orders'] = INITIAL_ORDERS;
            this.saveToStorage('orders');
        }
        if (!this.tables['user_roles'] || this.tables['user_roles'].length === 0) {
            this.tables['user_roles'] = INITIAL_USER_ROLES;
            this.saveToStorage('user_roles');
        }
    }

    private loadFromStorage() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.storagePrefix)) {
                const tableName = key.replace(this.storagePrefix, '');
                try {
                    this.tables[tableName] = JSON.parse(localStorage.getItem(key) || '[]');
                } catch {
                    this.tables[tableName] = [];
                }
            }
        });
    }

    private saveToStorage(tableName: string) {
        localStorage.setItem(this.storagePrefix + tableName, JSON.stringify(this.tables[tableName]));
    }

    from(table: string) {
        if (!this.tables[table]) {
            this.tables[table] = [];
        }
        return new QueryBuilder(this.tables[table], table, (newData) => {
            this.tables[table] = newData;
            this.saveToStorage(table);
        }, this);
    }

    // Realtime Simulation
    private subscriptions: { table: string, callback: (payload: any) => void }[] = [];

    subscribe(table: string, callback: (payload: any) => void) {
        this.subscriptions.push({ table, callback });
        return {
            unsubscribe: () => {
                this.subscriptions = this.subscriptions.filter(s => s.callback !== callback);
            }
        };
    }

    public notifySubscribers(table: string, eventType: 'INSERT' | 'UPDATE' | 'DELETE', oldRecord: any, newRecord: any) {
        this.subscriptions.filter(s => s.table === table).forEach(s => {
            s.callback({
                eventType,
                old: oldRecord,
                new: newRecord,
                table
            });
        });
    }

    // Mock Auth
    authListenerCallback: ((event: string, session: any) => void) | null = null;

    auth = {
        getSession: async () => {
            const sessionStr = localStorage.getItem('mock_session');
            return { data: { session: sessionStr ? JSON.parse(sessionStr) : null }, error: null };
        },
        onAuthStateChange: (callback: (event: string, session: any) => void) => {
            this.authListenerCallback = callback;
            return { data: { subscription: { unsubscribe: () => { this.authListenerCallback = null; } } } };
        },
        signInWithPassword: async ({ email, password }: any) => {
            // Mock login
            const user = this.tables['profiles'].find((p: any) => p.email === email);
            if (!user) {
                return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
            }

            const session = {
                access_token: 'mock-token-' + Date.now(),
                user: { ...user } // Ensure we copy the user object
            };
            localStorage.setItem('mock_session', JSON.stringify(session));

            // Notify listener
            if (this.authListenerCallback) {
                this.authListenerCallback('SIGNED_IN', session);
            }

            return { data: { user: session.user, session }, error: null };
        },
        signUp: async ({ email, password }: any) => {
            const existing = this.tables['profiles'].find((p: any) => p.email === email);
            if (existing) {
                return { data: { user: null, session: null }, error: { message: 'User already registered' } };
            }
            const newUser = {
                id: 'user-' + Date.now(),
                email,
                role: 'user', // Default role
                balance: 0,
                is_active: true,
                created_at: new Date().toISOString()
            };
            this.tables['profiles'].push(newUser);
            this.saveToStorage('profiles');

            // Create user role
            const userRole = {
                id: 'role-' + Date.now(),
                user_id: newUser.id,
                role: 'user',
                created_at: new Date().toISOString()
            };
            this.tables['user_roles'].push(userRole);
            this.saveToStorage('user_roles');

            const session = {
                access_token: 'mock-token-' + Date.now(),
                user: { ...newUser }
            };
            localStorage.setItem('mock_session', JSON.stringify(session));

            // Notify listener
            if (this.authListenerCallback) {
                this.authListenerCallback('SIGNED_IN', session);
            }

            return { data: { user: newUser, session }, error: null };
        },
        signOut: async () => {
            localStorage.removeItem('mock_session');
            // Notify listener
            if (this.authListenerCallback) {
                this.authListenerCallback('SIGNED_OUT', null);
            }
            return { error: null };
        },
        getUser: async () => {
            const session = localStorage.getItem('mock_session');
            if (!session) return { data: { user: null }, error: null };
            const parsed = JSON.parse(session);
            return { data: { user: parsed.user }, error: null };
        },
        updateUser: async (attributes: { email?: string, password?: string, data?: any }) => {
            const sessionStr = localStorage.getItem('mock_session');
            if (!sessionStr) return { data: { user: null }, error: { message: 'Not logged in' } };
            const session = JSON.parse(sessionStr);
            const userId = session.user.id;

            const userIndex = this.tables['profiles'].findIndex((p: any) => p.id === userId);
            if (userIndex === -1) return { data: { user: null }, error: { message: 'User not found' } };

            const updatedUser = { ...this.tables['profiles'][userIndex] };

            if (attributes.email) updatedUser.email = attributes.email;
            if (attributes.data) {
                // Merge metadata if needed
            }

            this.tables['profiles'][userIndex] = updatedUser;
            this.saveToStorage('profiles');

            // Update session
            const newSession = { ...session, user: updatedUser };
            localStorage.setItem('mock_session', JSON.stringify(newSession));
            // Notify listener
            if (this.authListenerCallback) {
                this.authListenerCallback('USER_UPDATED', newSession);
            }

            return { data: { user: updatedUser }, error: null };
        },
        admin: {
            createUser: async ({ email, password, email_confirm, user_metadata }: any) => {
                const existing = this.tables['profiles'].find((p: any) => p.email === email);
                if (existing) {
                    return { data: { user: null }, error: { message: 'User already exists' } };
                }

                const newUser = {
                    id: 'user-' + Date.now(),
                    email,
                    role: user_metadata?.role || 'user',
                    balance: 0,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    metadata: user_metadata || {}
                };

                this.tables['profiles'].push(newUser);
                this.saveToStorage('profiles');

                const userRole = {
                    id: 'role-' + Date.now(),
                    user_id: newUser.id,
                    role: user_metadata?.role || 'user',
                    created_at: new Date().toISOString()
                };
                this.tables['user_roles'].push(userRole);
                this.saveToStorage('user_roles');

                return { data: { user: newUser }, error: null };
            }
        }
    };

    // RPC Simulation
    async rpc(functionName: string, params: any): Promise<PostgrestSingleResponse<any>> {
        if (functionName === 'refund_order') {
            const { order_id } = params;
            const orderIndex = this.tables['orders'].findIndex((o: any) => o.id === order_id);
            if (orderIndex === -1) {
                return { data: null, error: { message: 'Order not found', details: '', hint: '', code: '404' }, count: null, status: 404, statusText: 'Not Found' };
            }

            const order = this.tables['orders'][orderIndex];
            if (order.status === 'cancelled') {
                return { data: null, error: { message: 'Order already cancelled', details: '', hint: '', code: '400' }, count: null, status: 400, statusText: 'Bad Request' };
            }

            const userIndex = this.tables['profiles'].findIndex((p: any) => p.id === order.user_id);
            if (userIndex === -1) {
                return { data: null, error: { message: 'User not found', details: '', hint: '', code: '404' }, count: null, status: 404, statusText: 'Not Found' };
            }

            // Perform updates
            // 1. Refund Balance
            const refundAmount = Number(order.amount);
            const currentBalance = Number(this.tables['profiles'][userIndex].balance) || 0;
            this.tables['profiles'][userIndex].balance = currentBalance + refundAmount;
            this.saveToStorage('profiles');

            // 2. Cancel Order
            this.tables['orders'][orderIndex].status = 'cancelled';
            this.tables['orders'][orderIndex].updated_at = new Date().toISOString();
            this.saveToStorage('orders');

            // 3. Notify
            const updatedUser = this.tables['profiles'][userIndex];
            // Notify listener
            if (this.authListenerCallback) {
                const sessionStr = localStorage.getItem('mock_session');
                if (sessionStr) {
                    const session = JSON.parse(sessionStr);
                    if (session.user.id === updatedUser.id) {
                        const newSession = { ...session, user: updatedUser };
                        localStorage.setItem('mock_session', JSON.stringify(newSession));
                        this.authListenerCallback('USER_UPDATED', newSession);
                    }
                }
            }
            this.notifySubscribers('orders', 'UPDATE', order, this.tables['orders'][orderIndex]);

            return { data: true, error: null, count: null, status: 200, statusText: 'OK' };
        }

        return { data: null, error: { message: 'Function not found', details: '', hint: '', code: '404' }, count: null, status: 404, statusText: 'Not Found' };
    }
}

class QueryBuilder {
    private data: any[];
    private tableName: string;
    private onUpdate: (data: any[]) => void;
    private db: MockDB;
    private filters: ((item: any) => boolean)[] = [];
    private sort: { column: string, ascending: boolean } | null = null;
    private limitVal: number | null = null;
    private isSingle: boolean = false;
    private selectQuery: string = '*';

    constructor(data: any[], tableName: string, onUpdate: (data: any[]) => void, db: MockDB) {
        this.data = data;
        this.tableName = tableName;
        this.onUpdate = onUpdate;
        this.db = db;
    }

    select(query: string = '*') {
        this.selectQuery = query;
        return this;
    }

    eq(column: string, value: any) {
        this.filters.push((item) => {
            // console.log(`Filter [eq]: ${item[column]} == ${value} ?`, item[column] == value);
            return item[column] == value;
        });
        return this;
    }

    neq(column: string, value: any) {
        this.filters.push((item) => item[column] !== value);
        return this;
    }

    gt(column: string, value: any) {
        this.filters.push((item) => item[column] > value);
        return this;
    }

    gte(column: string, value: any) {
        this.filters.push((item) => item[column] >= value);
        return this;
    }

    lt(column: string, value: any) {
        this.filters.push((item) => item[column] < value);
        return this;
    }

    lte(column: string, value: any) {
        this.filters.push((item) => item[column] <= value);
        return this;
    }

    in(column: string, values: any[]) {
        this.filters.push((item) => values.includes(item[column]));
        return this;
    }

    order(column: string, { ascending = true } = {}) {
        this.sort = { column, ascending };
        return this;
    }

    limit(count: number) {
        this.limitVal = count;
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    maybeSingle() {
        this.isSingle = true;
        return this; // In mock, single() and maybeSingle() behave similarly for result structure
    }

    insert(row: any) {
        this._pendingInsert = row;
        return this;
    }

    update(updates: any) {
        this._pendingUpdates = updates;
        return this;
    }

    delete() {
        this._pendingDelete = true;
        return this;
    }

    private _pendingUpdates: any = null;
    private _pendingInsert: any = null;
    private _pendingDelete: boolean = false;

    // Simulate promise interface
    then(resolve: (value: any) => void, reject: (reason: any) => void) {
        // EXECUTE PENDING OPERATIONS

        // 1. INSERT
        if (this._pendingInsert) {
            const row = this._pendingInsert;
            // Basic auto-increment ID for numbers
            if (!row.id) {
                const maxId = this.data.reduce((max, item) => (typeof item.id === 'number' && item.id > max ? item.id : max), 0);
                row.id = maxId + 1;
            }
            if (!row.created_at) row.created_at = new Date().toISOString();

            const newData = [...this.data, row];
            this.onUpdate(newData);

            // Notify subscribers
            this.db.notifySubscribers(this.tableName, 'INSERT', null, row);

            resolve({ data: row, error: null, count: null, status: 201, statusText: 'Created' });
            return;
        }

        // 2. UPDATE
        if (this._pendingUpdates) {
            console.log(`[MockDB] Executing UPDATE on ${this.tableName}`, this._pendingUpdates);
            let updatedCount = 0;
            let updatedRows: any[] = [];

            const newData = this.data.map(item => {
                // Check if item matches all filters
                const match = this.filters.every(f => f(item));
                if (match) {
                    updatedCount++;
                    console.log(`[MockDB] Matched item for update:`, item.id);
                    const updatedItem = { ...item, ...this._pendingUpdates, updated_at: new Date().toISOString() };
                    updatedRows.push(updatedItem);
                    return updatedItem;
                }
                return item;
            });

            if (updatedCount > 0) {
                console.log(`[MockDB] Updated ${updatedCount} rows`);
                this.onUpdate(newData);
                updatedRows.forEach(row => {
                    this.db.notifySubscribers(this.tableName, 'UPDATE', null, row);
                });
            } else {
                console.warn(`[MockDB] UPDATE executed but NO rows matched filters on ${this.tableName}`);
            }

            resolve({ data: this.selectQuery !== '*' ? updatedRows : null, error: null, count: updatedCount, status: 200, statusText: 'OK' });
            return;
        }

        // 3. DELETE
        if (this._pendingDelete) {
            let deletedCount = 0;
            const newData = this.data.filter(item => {
                const match = this.filters.every(f => f(item));
                if (match) {
                    deletedCount++;
                    return false; // Remove
                }
                return true; // Keep
            });

            if (deletedCount > 0) {
                this.onUpdate(newData);
                // Simple delete notification
                this.db.notifySubscribers(this.tableName, 'DELETE', null, null);
            }

            resolve({ data: null, error: null, count: deletedCount, status: 204, statusText: 'No Content' });
            return;
        }

        // 4. SELECT (Default)
        // Apply filters
        let result = this.data;
        for (const filter of this.filters) {
            result = result.filter(filter);
        }

        if (this.sort) {
            result.sort((a, b) => {
                if (a[this.sort!.column] < b[this.sort!.column]) return this.sort!.ascending ? -1 : 1;
                if (a[this.sort!.column] > b[this.sort!.column]) return this.sort!.ascending ? 1 : -1;
                return 0;
            });
        }

        if (this.limitVal) {
            result = result.slice(0, this.limitVal);
        }

        // Handle joins - simplistic specific case for services -> category
        if (this.selectQuery.includes('category:categories')) {
            result = result.map(item => {
                if (item.category_id) {
                    const categories = JSON.parse(localStorage.getItem(this.db.storagePrefix + 'categories') || '[]');
                    item.category = categories.find((c: any) => c.id === item.category_id);
                }
                return item;
            });
        }

        if (this.isSingle) {
            resolve({ data: result.length > 0 ? result[0] : null, error: null, status: 200, statusText: 'OK' });
        } else {
            resolve({ data: result, error: null, count: result.length, status: 200, statusText: 'OK' });
        }
    }
}

export const mockDB = new MockDB();

