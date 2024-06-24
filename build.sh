VERSION=$(cat manifest.json | jaq .version | cut -d '"' -f 2 | tr '.' '_')
echo "Building Railgun ${VERSION}"
zip -r -FS release/railgun-${VERSION} * --exclude .git* release/*
echo "Build completed"
