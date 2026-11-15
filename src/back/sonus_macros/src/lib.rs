#[macro_export]
/// Wraps the expression in a `std::sync::LazyLock`.
macro_rules! lazy {
    ($e : expr) => {
        std::sync::LazyLock::new(|| {
            $e
        })
    }
}

#[macro_export]
/// No-op.
macro_rules! pass {
    () => {
        
    };
}

#[macro_export]
macro_rules! file_into_json_struct {
    ($lit : literal, $struct_type : ty) => {
        serde_json::from_str::<$struct_type>(&std::fs::read_to_string($lit).unwrap()).unwrap()
    };
}