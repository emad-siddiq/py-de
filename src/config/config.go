package config

import (
	"log"
	"os"

	"gopkg.in/yaml.v3"
)

// Parsing use goyaml.v3

//https://github.com/Zhwt/yaml-to-go
// POSTGRES:
// Password: abcdef
// IAM_ROOT: rootatIAM
// type YAML struct {
// 	POSTGRES struct {
// 		Password string `yaml:"Password"`
// 	} `yaml:"POSTGRES"`
// 	IAMROOT string `yaml:"IAM_ROOT"`
// }

// Equivalentlty:

// type YAML struct {
// 	POSTGRES `yaml:"POSTGRES"`
// 	IAMROOT  string `yaml:"IAM_ROOT"`
// }

// type POSTGRES struct {
// 	Password string `yaml:"Password"`
// }

type YAML struct {
	Postgres struct {
		Password string `yaml:"Password"`
	} `yaml:"POSTGRES"`

	AuthZ struct {
		Server struct {
			Url       string `yaml:"Url"`
			Endpoints struct {
				UserSignUp string `yaml:"UserSignUp"`
				Login      string `yaml:"Login"`
			} `yaml:"Endpoints"`
		} `yaml:"Server"`
	} `yaml:"AuthZ"`

	Client struct {
		Url string `yaml:"Url"`
	} `yaml:"Client"`

	IAMROOT string `yaml:"IAM_ROOT"`
}

/** Read YAML file and return *YAML **/
func ReadConfigFile() *YAML {

	//Read Config File
	data, err := os.ReadFile("./config/config.yaml") // TODO: Convert to env var
	if err != nil {
		log.Fatalf("error: %v", err)

		panic(err)
	}

	// Parse to YAML struct
	yaml_struct := YAML{}
	unMarshallErr := yaml.Unmarshal([]byte(data), &yaml_struct)
	if unMarshallErr != nil {
		log.Fatalf("error: %v", unMarshallErr)
		panic(unMarshallErr)
	}

	return &yaml_struct
}
