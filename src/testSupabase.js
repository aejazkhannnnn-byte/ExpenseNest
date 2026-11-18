import { supabase } from './supabase'

async function testConnection() {
  const { data, error } = await supabase
    .from('connection_test')
    .select('*')

  if (error) {
    console.log('Supabase Response:', error.message)
  } else {
    console.log('Supabase Connected!', data)
  }
}

testConnection()