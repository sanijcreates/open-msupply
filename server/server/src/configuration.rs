use config::{Config, ConfigError, Environment, File, FileSourceFile};
use service::settings::Settings;
use std::{
    env::{self, VarError},
    fmt::{Debug, Display, Formatter, Result as FmtResult},
    io::Error as IoError,
    path::PathBuf,
};

use crate::environment::{AppEnvironment, EnvironmentVariable};

const CONFIGURATION_DIRECTORY_PATH: &str = "configuration";
const CONFIGURATION_BASE_FILE_PATH: &str = "base";

const CONFIGURATION_ENVIRONMENT_PREFIX: &str = "app";
const CONFIGURATION_ENVIRONMENT_SEPARATOR: &str = "__";

pub enum SettingsError {
    Config(ConfigError),
    Environment(VarError),
    File(IoError),
}

/// Gets directory storing configuration files.
///
/// All configuration files should be stored in the same directory.
pub fn get_configuration_directory() -> Result<PathBuf, SettingsError> {
    let configuration_directory = env::current_dir()?.join(CONFIGURATION_DIRECTORY_PATH);
    Ok(configuration_directory)
}

/// Gets base configuration file.
///
/// The base configuration file stores configuration properties which are common between local and
/// production environments.
pub fn get_configuration_base_file() -> Result<File<FileSourceFile>, SettingsError> {
    let configuration_directory = get_configuration_directory()?;
    let base_file =
        File::from(configuration_directory.join(CONFIGURATION_BASE_FILE_PATH)).required(true);
    Ok(base_file)
}

/// Gets application configuration file.
///
/// The application configuration file stores environment-specific configuration properties. Valid
/// environments are `local` and `production`.
pub fn get_configuration_app_file() -> Result<File<FileSourceFile>, SettingsError> {
    let configuration_directory = get_configuration_directory()?;
    let app_file = File::from(configuration_directory.join(AppEnvironment::get())).required(true);
    Ok(app_file)
}

/// Gets environment configuration values.
///
/// In some instances it may be desirable to override the `local` and `production` defaults with
/// custom values. These can be defined using environment variables with the `app_` prefix and
/// with the `__` separator in place of dot notation.
///
/// For example, the following runs the application using the `local` configuration with the
/// `database.port` value set to `5433`:
///
/// APP_ENVIRONMENT=local APP_DATABASE__PORT=5433 cargo run
///
pub fn get_configuration_environment() -> Environment {
    Environment::with_prefix(CONFIGURATION_ENVIRONMENT_PREFIX)
        .separator(CONFIGURATION_ENVIRONMENT_SEPARATOR)
}

/// Gets app configuration.
///
/// App configuration varies based on whether the app is being run in a `local` or `production`
/// environment. Configuration files should be stored in a unique configuration directory, and
/// should define setting values for `base`, `local` and `production` environments.
///
/// Individual settings properties can be also manually defined as environment variables: see
/// `get_configuration_environment` for details.
pub fn get_configuration() -> Result<Settings, SettingsError> {
    let mut configuration: Config = Config::default();
    configuration
        .merge(get_configuration_base_file()?)?
        .merge(get_configuration_app_file()?)?
        .merge(get_configuration_environment())?;
    let settings: Settings = configuration.try_into()?;
    Ok(settings)
}

impl Debug for SettingsError {
    fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
        match self {
            SettingsError::Config(err) => write!(f, "{:?}", err),
            SettingsError::Environment(err) => write!(f, "{:?}", err),
            SettingsError::File(err) => write!(f, "{:?}", err),
        }
    }
}

impl Display for SettingsError {
    fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
        match self {
            SettingsError::Config(err) => write!(f, "{}", err),
            SettingsError::Environment(err) => write!(f, "{}", err),
            SettingsError::File(err) => write!(f, "{}", err),
        }
    }
}

impl From<ConfigError> for SettingsError {
    fn from(err: ConfigError) -> SettingsError {
        SettingsError::Config(err)
    }
}

impl From<IoError> for SettingsError {
    fn from(err: IoError) -> SettingsError {
        SettingsError::File(err)
    }
}

impl From<VarError> for SettingsError {
    fn from(err: VarError) -> SettingsError {
        SettingsError::Environment(err)
    }
}
