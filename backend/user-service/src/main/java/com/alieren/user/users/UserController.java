package com.alieren.user.users;

import com.alieren.user.users.dto.UpdateMeRequest;
import com.alieren.user.users.dto.UserProfileResponse;
import com.alieren.user.users.dto.UserSummaryResponse;
import com.alieren.user.users.dto.UserBatchRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.util.List;

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

    // ✅ YENİ: Avatar upload (multipart)
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserProfileResponse uploadAvatar(
            @RequestHeader("X-User-Id") String me,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestPart("file") MultipartFile file
    ) throws Exception {
        return service.uploadAvatar(
                me,
                file.getBytes(),
                file.getOriginalFilename(),
                file.getContentType(),
                authHeader
        );
    }

    @GetMapping("/{userId}/profile")
    public UserProfileResponse getProfileById(@PathVariable Long userId) {
        return service.getProfileById(userId);
    }

    @PostMapping("/batch")
    public List<UserSummaryResponse> getUsersByIds(@RequestBody UserBatchRequest request) {
        return service.getUsersByIds(request.ids());
    }
}
