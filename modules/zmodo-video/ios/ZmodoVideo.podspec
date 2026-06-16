Pod::Spec.new do |s|
  s.name           = 'ZmodoVideo'
  s.version        = '1.0.0'
  s.summary        = 'A sample project summary'
  s.description    = 'A sample project description'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Source files: the module's own Swift/ObjC files (top level) + ported render
  # layer. Do NOT glob vendor/** — those headers must stay off the framework
  # umbrella (they're only reached via HEADER_SEARCH_PATHS at compile time).
  s.source_files = "*.{h,m,mm,swift}", "render/**/*.{h,m,mm}"

  # Keep vendor tree and render source visible to the pod
  s.preserve_paths = "vendor/**/*", "render/**/*"

  # Proprietary static libraries (paths relative to this podspec, i.e. ios/)
  s.vendored_libraries =
    "vendor/LibCore/lib/liblibcore.a",
    "vendor/LibCore/lib/libGPAC4iOS.a",
    "vendor/FFmpeg/lib/libavcodec.a",
    "vendor/FFmpeg/lib/libavformat.a",
    "vendor/FFmpeg/lib/libavutil.a",
    "vendor/FFmpeg/lib/libswscale.a",
    "vendor/pjsip/lib-all/libpj-arm-apple-darwin9.a",
    "vendor/pjsip/lib-all/libpjlib-util-arm-apple-darwin9.a",
    "vendor/pjsip/lib-all/libpjnath-arm-apple-darwin9.a",
    "vendor/libSmartLink/libSmartLink_armv7_i386_release.a"

  # System frameworks required by LibCore / FFmpeg / pjsip / render
  s.frameworks = "VideoToolbox", "AVFoundation", "AudioToolbox", "CoreMedia",
                 "CoreGraphics", "OpenGLES", "CFNetwork", "SystemConfiguration"

  # System dylibs required by FFmpeg / LibCore
  s.libraries = "c++", "z", "bz2", "iconv"

  # Silence -Wdocumentation noise from the vendor headers' (Chinese) doc comments
  s.compiler_flags = "-Wno-documentation"

  # Swift/Objective-C compatibility + link settings
  s.pod_target_xcconfig = {
    'DEFINES_MODULE'    => 'YES',
    'OTHER_LDFLAGS'     => '-ObjC',
    'HEADER_SEARCH_PATHS' =>
      '"$(PODS_TARGET_SRCROOT)/vendor/LibCore/include" ' \
      '"$(PODS_TARGET_SRCROOT)/vendor/FFmpeg/include" ' \
      '"$(PODS_TARGET_SRCROOT)/vendor/pjsip/include" ' \
      '"$(PODS_TARGET_SRCROOT)/render"',
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64 arm64',
    'VALID_ARCHS'                        => 'arm64',
  }
end
