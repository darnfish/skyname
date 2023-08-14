import Knex from 'knex'

const knex = Knex({
	client: 'pg',
	connection: process.env.POSTGRES_URL
})

export default knex
