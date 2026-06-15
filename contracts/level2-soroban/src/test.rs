#[cfg(test)]
mod tests {
    use super::super::Level2Soroban;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};

    #[test]
    fn contract_tracks_state() {
        let env = Env::default();
        let contract_id = env.register_contract(None, Level2Soroban);
        let client = Level2SorobanClient::new(&env, &contract_id);
        client.initialize();

        let caller = Address::random(&env);
        let value = client.increment(&caller);
        assert_eq!(value, 1);

        let message = client.set_message(&caller, &String::from_str(&env, "hello"));
        assert_eq!(message, String::from_str(&env, "hello"));

        let state = client.get_state();
        assert_eq!(state.0, 1);
    }
}