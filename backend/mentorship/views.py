"""
Views — mentoria (Por ELAS finance).
"""

from __future__ import annotations

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from lessons.permissions import EmpresaAprovada

from .models import Booking, MentorshipSlot
from .serializers import BookingSerializer, SlotCreateSerializer, SlotSerializer
from .services import (
    ForaDaJanela,
    Indisponivel,
    LimiteMensal,
    agendar,
    cancelar,
)


def _profile(request):
    return request.user.profile


class HorariosView(APIView):
    """GET lista disponíveis; POST cadastra (empresa aprovada)."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), EmpresaAprovada()]
        return [IsAuthenticated()]

    def get(self, request):
        qs = (
            MentorshipSlot.objects.select_related("company")
            .filter(reservado=False, inicio__gt=timezone.now())
            .order_by("inicio")
        )
        return Response(SlotSerializer(qs, many=True).data)

    def post(self, request):
        profile = _profile(request)
        ser = SlotCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        slot = ser.save(company=profile.company, criado_por=profile)
        return Response(SlotSerializer(slot).data, status=status.HTTP_201_CREATED)


class MeusHorariosView(APIView):
    """Horários cadastrados pela empresa da usuária."""

    permission_classes = [IsAuthenticated, EmpresaAprovada]

    def get(self, request):
        profile = _profile(request)
        qs = MentorshipSlot.objects.select_related("company").filter(
            company=profile.company
        )
        return Response(SlotSerializer(qs, many=True).data)


class HorarioDetailView(APIView):
    """DELETE cancela o horário (empresa dona)."""

    permission_classes = [IsAuthenticated, EmpresaAprovada]

    def delete(self, request, pk):
        profile = _profile(request)
        slot = get_object_or_404(MentorshipSlot, pk=pk)
        if not profile.company_id or slot.company_id != profile.company_id:
            return Response(
                {"detail": "Você só pode remover horários da sua empresa."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Se houver reserva ativa, ela cai junto (cascade); libera a usuária.
        slot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AgendarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = agendar(_profile(request), pk)
        except LimiteMensal as exc:
            return Response(
                {"code": "limite_mensal", "detail": str(exc)},
                status=status.HTTP_409_CONFLICT,
            )
        except Indisponivel as exc:
            return Response(
                {"code": "indisponivel", "detail": str(exc)},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(
            BookingSerializer(booking).data, status=status.HTTP_201_CREATED
        )


class MinhasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Booking.objects.select_related("slot", "slot__company")
            .filter(profile=_profile(request))
            .order_by("-slot__inicio")
        )
        return Response(BookingSerializer(qs, many=True).data)


class CancelarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = cancelar(_profile(request), pk)
        except ForaDaJanela as exc:
            return Response(
                {"code": "fora_da_janela", "detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Indisponivel as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(BookingSerializer(booking).data)
