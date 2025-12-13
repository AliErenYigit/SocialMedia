package com.alieren.user.users;

import com.alieren.user.users.dto.UpdateMeRequest;
import com.alieren.user.users.dto.UserProfileResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserProfileService service;

    public UserController(UserProfileService service) {
        this.service = service;
    }

    @GetMapping("/me")
    public UserProfileResponse me(@RequestHeader("X-User-Id") String userId) {
        return service.getMe(userId);
    }

    @PatchMapping("/me")
    public UserProfileResponse updateMe(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody UpdateMeRequest req
    ) {
        return service.updateMe(userId, req);
    }
}
