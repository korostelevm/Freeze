#! /usr/bin/env bash
set -e
version=$(git rev-parse HEAD | cut -c1-8)
version=xxxxxxx
app_name=ha-wtf
bucket=$1


echo "
Deploying - 
    bucket: ${bucket}
    version: ${version}
    app_name: ${app_name}

    "
# echo -n "you down with that? (y/n)? "
# read answer
# if [ "$answer" != "${answer#[Yy]}" ] ;then
#     echo Deploying ${app_name}-${version}
# else
#     echo Aborted
#     exit 0
# fi

set -x
npm run build:microfrontend

sam package --template-file template.yaml --s3-bucket ${bucket} --s3-prefix ${app_name}-${version} --output-template-file template-built.yaml
sam deploy --template-file template-built.yaml --stack-name ${app_name} --capabilities CAPABILITY_NAMED_IAM --no-fail-on-empty-changeset

rm template-api-built.yaml