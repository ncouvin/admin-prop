import type { User, Property, TenantContract, Service, Expense, Income } from '../types';

const STORAGE_KEYS = {
    USERS: 'admin_prop_users',
    PROPERTIES: 'admin_prop_properties',
    CONTRACTS: 'admin_prop_contracts',
    SERVICES: 'admin_prop_services',
    EXPENSES: 'admin_prop_expenses',
    INCOMES: 'admin_prop_incomes',
};

// Datos iniciales de prueba
const INITIAL_USERS: User[] = [
    {
        id: '1',
        name: 'Juan Propietario',
        email: 'juan@demo.com',
        phone: '1122334455',
        cuit: '20112233445',
        role: 'owner',
        groupId: 'group-1'
    },
    {
        id: '2',
        name: 'Maria Inquilina',
        email: 'maria@demo.com',
        phone: '1155667788',
        cuit: '27112233445',
        role: 'tenant',
        groupId: 'group-1'
    }
];

const INITIAL_PROPERTIES: Property[] = [
    {
        id: 'prop-1',
        name: 'Depto Centro',
        address: {
            street: 'Av. Corrientes 1234',
            city: 'CABA',
            country: 'Argentina',
            floor: '5',
            apartment: 'A'
        },
        type: 'apartment',
        currency: 'USD',
        features: {
            rooms: 2,
            bathrooms: 1,
            coveredArea: 50,
            uncoveredArea: 0,
            amenities: ['Gym', 'Sum']
        },
        ownerId: '1',
        tenantId: '2',
        images: [],
        documents: []
    }
];

class MockService {
    private get<T>(key: string, initialData: T[]): T[] {
        const data = localStorage.getItem(key);
        if (!data) {
            localStorage.setItem(key, JSON.stringify(initialData));
            return initialData;
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error(`Error parsing localStorage key "${key}":`, e);
            localStorage.removeItem(key);
            return initialData;
        }
    }

    private set<T>(key: string, data: T[]): void {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // Users
    getUsers(): User[] {
        return this.get(STORAGE_KEYS.USERS, INITIAL_USERS);
    }

    login(email: string): User | undefined {
        const users = this.getUsers();
        return users.find(u => u.email === email);
    }

    register(user: User): User {
        const users = this.getUsers();
        users.push(user);
        this.set(STORAGE_KEYS.USERS, users);
        return user;
    }

    // Services
    getServices(propertyId: string): Service[] {
        const services = this.get<Service>(STORAGE_KEYS.SERVICES, []);
        return services.filter(s => s.propertyId === propertyId);
    }

    addService(service: Service): Service {
        const services = this.get<Service>(STORAGE_KEYS.SERVICES, []);
        services.push(service);
        this.set(STORAGE_KEYS.SERVICES, services);
        return service;
    }

    deleteService(id: string): void {
        const services = this.get<Service>(STORAGE_KEYS.SERVICES, []);
        const newServices = services.filter(s => s.id !== id);
        this.set(STORAGE_KEYS.SERVICES, newServices);
    }

    // Contracts
    getContracts(propertyId: string): TenantContract[] {
        const contracts = this.get<TenantContract>(STORAGE_KEYS.CONTRACTS, []);
        return contracts.filter(c => c.propertyId === propertyId);
    }

    addContract(contract: TenantContract): TenantContract {
        const contracts = this.get<TenantContract>(STORAGE_KEYS.CONTRACTS, []);
        // Deactivate other active contracts for this property
        const updatedContracts = contracts.map(c => {
            if (c.propertyId === contract.propertyId && c.isActive) {
                return { ...c, isActive: false };
            }
            return c;
        });
        updatedContracts.push(contract);
        this.set(STORAGE_KEYS.CONTRACTS, updatedContracts);

        // Update property current tenant
        const props = this.getProperties();
        const propIndex = props.findIndex(p => p.id === contract.propertyId);
        if (propIndex !== -1) {
            props[propIndex].tenantId = contract.tenantId;
            this.set(STORAGE_KEYS.PROPERTIES, props);
        }

        return contract;
    }

    updateContract(contract: TenantContract): TenantContract {
        const contracts = this.get<TenantContract>(STORAGE_KEYS.CONTRACTS, []);
        const index = contracts.findIndex(c => c.id === contract.id);
        if (index !== -1) {
            contracts[index] = contract;
            this.set(STORAGE_KEYS.CONTRACTS, contracts);
        }
        return contract;
    }

    // Expenses
    getExpenses(propertyId: string): Expense[] {
        const expenses = this.get<Expense>(STORAGE_KEYS.EXPENSES, []);
        return expenses.filter(e => e.propertyId === propertyId);
    }

    addExpense(expense: Expense): Expense {
        const expenses = this.get<Expense>(STORAGE_KEYS.EXPENSES, []);
        expenses.push(expense);
        this.set(STORAGE_KEYS.EXPENSES, expenses);
        return expense;
    }

    // Incomes
    getIncomes(propertyId: string): Income[] {
        const incomes = this.get<Income>(STORAGE_KEYS.INCOMES, []);
        return incomes.filter(i => i.propertyId === propertyId);
    }

    addIncome(income: Income): Income {
        const incomes = this.get<Income>(STORAGE_KEYS.INCOMES, []);
        incomes.push(income);
        this.set(STORAGE_KEYS.INCOMES, incomes);
        return income;
    }

    // Properties
    getProperties(ownerId?: string): Property[] {
        const props = this.get(STORAGE_KEYS.PROPERTIES, INITIAL_PROPERTIES);
        if (ownerId) {
            return props.filter(p => p.ownerId === ownerId);
        }
        return props;
    }

    addProperty(property: Property): Property {
        const props = this.getProperties();
        props.push(property);
        this.set(STORAGE_KEYS.PROPERTIES, props);
        return property;
    }

    updateProperty(property: Property): Property {
        const props = this.getProperties();
        const index = props.findIndex(p => p.id === property.id);
        if (index !== -1) {
            props[index] = property;
            this.set(STORAGE_KEYS.PROPERTIES, props);
        }
        return property;
    }

    deleteProperty(id: string): void {
        const props = this.getProperties();
        const newProps = props.filter(p => p.id !== id);
        this.set(STORAGE_KEYS.PROPERTIES, newProps);
    }
}

export const mockService = new MockService();
