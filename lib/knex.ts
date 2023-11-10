import Knex from 'knex'

const knex = Knex({
	client: 'pg',
	connection: {
		connectionString: process.env.POSTGRES_URL,
		ssl: false
	}
})

export default knex
