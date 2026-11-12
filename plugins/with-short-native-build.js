// Windows only allows 260-character file paths. React Native's C++ build folder sits deep
// inside android/app/.cxx, which runs past that limit for phone (arm64) builds. This moves
// the C++ build folder to <project>/.cx so the paths stay short. Applied on every prebuild.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARK = '// spelling-stars: short C++ build folder';
module.exports = function withShortNativeBuild(config) {
  return withAppBuildGradle(config, cfg => {
    if (!cfg.modResults.contents.includes(MARK)) {
      cfg.modResults.contents += `
${MARK}
android {
    externalNativeBuild {
        cmake {
            buildStagingDirectory = file("\${rootDir}/../.cx")
        }
    }
}
`;
    }
    return cfg;
  });
};
