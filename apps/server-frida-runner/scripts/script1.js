Java.perform(function() {
    var targetClasses = [
        'com.spotify.playbacknative.AudioDriver',
        'com.spotify.localfiles.mediastore.MediaStoreReader',
        'com.spotify.core.http.NativeHttpConnection',
        'com.spotify.appstorage.userdirectoryimpl.NativeUserDirectoryManagerImpl',
        'com.paramsen.noise.NoiseNativeBridge',
        'com.spotify.oggopusencoder.NativeOggOpusEncoder',
        'com.spotify.esperanto.esperantoimpl.NativeSingleObserver',
        'com.spotify.connectivity.WebgateUserAgentPlatform'
    ];

    function truncateArgument(arg, maxLength) {
        if (typeof arg === 'string') {
            return arg.length > maxLength ? arg.substring(0, maxLength) + '...' : arg;
        } else if (Array.isArray(arg)) {
            return arg.length > maxLength ? JSON.stringify(arg.slice(0, maxLength)) + '... (truncated)' : JSON.stringify(arg);
        } else if (typeof arg === 'object' && arg !== null) {
            var jsonString = JSON.stringify(arg);
            return jsonString.length > maxLength ? jsonString.substring(0, maxLength) + '... (truncated)' : jsonString;
        }
        return arg;
    }

    targetClasses.forEach(function(targetClassName) {
        var TargetClass = Java.use(targetClassName);

        // Hook methods dynamically
        var methods = TargetClass.class.getDeclaredMethods();
        methods.forEach(function(method) {
            var methodName = method.getName();
            var methodOverloads = TargetClass[methodName].overloads;

            methodOverloads.forEach(function(overload) {
                overload.implementation = function() {
                    console.log(`\nClass: ${targetClassName}`);
                    console.log(`Function Called: ${methodName}()`);
                    console.log(`No. of args: ${arguments.length}`);
                    for (var i = 0; i < arguments.length; i++) {
                        console.log(`    |--- arg${i} (type: ${typeof arguments[i]}): ${truncateArgument(arguments[i], 50)}`);
                    }

                    var returnValue = this[methodName].apply(this, arguments);

                    console.log(`Returned Value:`);
                    console.log(`    |--- (type: ${typeof returnValue}): ${truncateArgument(returnValue, 50)}\n`);

                    return returnValue;
                };
            });
        });
    });
});
